`timescale 1ns / 1ps

module debounce #(
    parameter STABLE_CYCLE = 22  // number of cycles input must stay stable
)(
    input wire clk,
    input wire sw_in,
    output reg sw_out = 0
);

    reg [STABLE_CYCLE-1:0] counter = 0;
    reg sw_state = 0;

    always @(posedge clk) begin
        if (sw_in != sw_state) begin
            counter <= counter + 1;
            if (&counter) begin
                sw_state <= sw_in;
                sw_out   <= sw_in;
                counter  <= 0;
            end
        end else begin
            counter <= 0;
        end
    end
endmodule

module seven_segment_display(
    input wire reset,
    input wire clk,
    input wire [7:0] value,
    input wire enable,
    output reg [3:0] an,
    output reg [6:0] seg
);

    function [6:0] hex2seg(input [3:0] h);
        case(h)
            4'h0: hex2seg = 7'b1000000;
            4'h1: hex2seg = 7'b1111001;
            4'h2: hex2seg = 7'b0100100;
            4'h3: hex2seg = 7'b0110000;
            4'h4: hex2seg = 7'b0011001;
            4'h5: hex2seg = 7'b0010010;
            4'h6: hex2seg = 7'b0000010;
            4'h7: hex2seg = 7'b1111000;
            4'h8: hex2seg = 7'b0000000;
            4'h9: hex2seg = 7'b0010000;
            4'hA: hex2seg = 7'b0001000;
            4'hB: hex2seg = 7'b0000011;
            4'hC: hex2seg = 7'b1000110;
            4'hD: hex2seg = 7'b0100001;
            4'hE: hex2seg = 7'b0000110;
            4'hF: hex2seg = 7'b0001110;
            default: hex2seg=7'b1111111;
        endcase
    endfunction

    reg reset_active;
    reg [29:0] reset_counter = 0;
    reg [19:0] display_counter = 0;
    reg [1:0] curr_digit = 0;

    reg [6:0] dataout [3:0];

    always @(posedge clk or posedge reset) begin
        if (reset) begin
            reset_active <= 1'b1;
            reset_counter <= 30'd0;
            display_counter <= 20'd0;
            curr_digit <= 2'd0;
            an <= 4'b1111;
            seg <= 7'b1111111;
            dataout[0] <= 7'b0000111;
            dataout[1] <= 7'b0010010;
            dataout[2] <= 7'b0101111;
            dataout[3] <= 7'b0111111;
        end else begin
            if (reset_active) begin
                reset_counter <= reset_counter + 1;
                if (reset_counter == 30'd500_000_000) begin
//                if (reset_counter == 30'd10) begin // For synthesis
                    reset_active <= 1'b0;
                end
            end
            else begin
                if(enable) begin
                    dataout[0] <= hex2seg(value[3:0]);
                    dataout[1] <= hex2seg(value[7:4]);
                end else begin
                    dataout[0] <= 7'b1111111;
                    dataout[1] <= 7'b1111111;
                end
                dataout[2] <= 7'b1111111;
                dataout[3] <= 7'b1111111;



            end
            display_counter <= display_counter + 1;
            if (display_counter == 20'd100_000) begin
//            if (display_counter == 20'd1) begin //For simulation of test bench
                display_counter <= 20'd0;
                curr_digit <= curr_digit + 1;
                case (curr_digit)
                    2'd0: begin an <= 4'b1110; seg <= dataout[0]; end
                    2'd1: begin an <= 4'b1101; seg <= dataout[1]; end
                    2'd2: begin an <= 4'b1011; seg <= dataout[2]; end
                    2'd3: begin an <= 4'b0111; seg <= dataout[3]; end

                    default: begin an <= 4'b1111; seg <= 7'b1111111; end
                endcase
            end
        end
    end

endmodule

module linked_list #( parameter NUM_NODES = 32, width = 6 )(
    input wire clk,
    input wire btnC,
    input [15:0] sw,
    output [3:0] an,
    output [6:0] seg,
    output reg [1:0] led
    );
    reg [width-1:0] NULL = NUM_NODES;

    reg [width-1:0] head, tail, next, curr, prev;
    reg [7:0] data_array [0:NUM_NODES-1];
    reg [width-1:0] next_array [0:NUM_NODES-1];
    reg [7:0] display_val;
    reg display_enable;
    wire [7:0] in_data = sw[7:0];
    wire [2:0] op = sw[15:13];

    reg [2:0] op_to_do;
    reg op_pending;
    reg search;
    reg traverse;
    reg [2:0] op_prev;
    wire op_new;

    always@(posedge clk)begin
        op_prev <= op;
    end
    assign op_new = (op&~ op_prev) && (op != 3'b000 && op != 3'b001 && op != 3'b010 && op != 3'b011);
    
    wire btnc_clean;
    reg  btnc_del = 0;
    wire btnc_on_1_pulse;

    debounce #(.STABLE_CYCLE(22)) db_btnc (
        .clk(clk),
        .sw_in(btnC),
        .sw_out(btnc_clean)
    );

    always @(posedge clk) begin
        btnc_del <= btnc_clean;
    end
    assign btnc_on_1_pulse = btnc_clean & ~btnc_del;
    reg [29:0] delay_counter;
    integer i;
    always @(posedge clk) begin
        if(btnc_on_1_pulse) begin
            for (i = 0; i < NUM_NODES-1; i = i + 1) begin
                next_array[i] <= i + 1;
                data_array[i] <= 0;
            end
            next_array[NUM_NODES-1] <= NULL;
            data_array[NUM_NODES-1] <= 0;
            next <= 0;
            head <= NULL;
            tail <= NULL;
            led <= 2'b00;
            display_val <= 0;
            display_enable <= 0;
            delay_counter <= 0;
            op_pending <= 0;
            search <= 0;
            traverse <= 0;
        end else begin
            if(op_new && !op_pending && !search && !traverse) begin
                op_to_do <= op;
                op_pending <= 1;
            end
            if(op_pending)begin
                op_pending <= 0;
                case(op_to_do)
                    3'b100: begin
                        if(next == NULL)
                            led[0] <= 1;
                        else begin
                            led[0] <= 0;
                            led[1]<=0;
                            data_array[next] <= in_data;
                            next_array[next] <= head;
                            head <= next;
                            if(tail==NULL)
                                tail <= next;
                            next <= next_array[next];
                        end
                    end
                    3'b101: begin
                        if(next==NULL)
                            led[0] <= 1;
                        else begin
                            led[0] <= 0;
                                  led[1]<=0;
                            data_array[next] <= in_data;
                            next_array[next] <= NULL;
                            if(tail!=NULL)
                                next_array[tail] <= next;
                            else
                                head <= next;
                            tail <= next;
                            next <= next_array[next];

                        end
                    end

                    3'b110: begin
                        if(head==NULL)
                            led[1] <= 1;
                        else begin
                            curr <= head;
                            prev <= NULL;
                            led[1] <= 0;
                            search <= 1;
                        end
                    end

                    3'b111: begin
                        delay_counter <= 0;
                        if(head==NULL)
                            led[1] <= 1;
                        else begin
                            curr <= head;
                            traverse <= 1;
                            led[1] <= 0;
                        end
                    end

                endcase
            end

            if(search) begin
                if(curr==NULL) begin
                    search <= 0;
                end
                else if(data_array[curr] == in_data) begin
                    if(prev==NULL)
                        head <= next_array[curr];
                    else
                        next_array[prev] <= next_array[curr];
                    if(curr==tail)
                        tail <= prev;
                    next_array[curr] <= next;
                    next <= curr;
                    search <= 0;
                    data_array[curr] <= 0;
                    led[0] <= 0;
                end else begin
                    prev <= curr;
                    curr <= next_array[curr];
                end
            end

            if(traverse) begin
                if(delay_counter == 30'd100_000_000) begin
//                if(delay_counter == 30'd10) begin
                    delay_counter <= 0;
                    if(curr==NULL) begin
                        display_enable <= 0;
                        traverse <= 0;
                    end else begin
                        display_val <= data_array[curr];
                        display_enable <= 1;
                        curr <= next_array[curr];
                    end
                end else
                    delay_counter <= delay_counter + 1;
            end
        end
    end
    seven_segment_display sseg_inst (
        .reset(btnC),
        .clk(clk),
        .value(display_val),
        .enable(display_enable),
        .an(an),
        .seg(seg)
    );

endmodule