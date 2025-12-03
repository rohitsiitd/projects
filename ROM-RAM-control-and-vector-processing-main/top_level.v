`timescale 1ns / 1ps

module seven_segment_display(
    input wire reset,
    input wire clk,
    input wire [1:0] sw,
    input wire [3:0] rom_data,
    input wire [3:0] ram0_data,
    input wire [4:0] ram1_data,
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
            4'hC: hex2seg = 7'b0100111;
            4'hD: hex2seg = 7'b0100001;
            4'hE: hex2seg = 7'b0000110;
            4'hF: hex2seg = 7'b0001110;
            default: hex2seg=7'b1111111;
        endcase
    endfunction
    
    reg reset_active;
    reg [29:0] reset_counter = 0;
    reg [16:0] display_scan_counter = 0;
    reg [1:0] curr_digit = 0;
    reg [6:0] dataout [3:0];
    
    always @(posedge clk or posedge reset) begin
        if (reset) begin
            reset_active <= 1'b1;
            reset_counter <= 30'd0;
            an <= 4'b1111;
            seg <= 7'b1111111;
            display_scan_counter <= 17'd0;
            curr_digit <= 2'd0;
            dataout[0] <= 7'b1111111;
            dataout[1] <= 7'b1111111;
            dataout[2] <= 7'b1111111;
            dataout[3] <= 7'b1111111;
        end else begin
            if (reset_active) begin
                reset_counter <= reset_counter + 1;
//             if(reset_counter == 30'd499999999) begin // ~5s @100MHz
                if(reset_counter == 30'd10) begin // For simulation of test bench
                    reset_active <= 1'b0;
                end
                dataout[0] <= 7'b0000111;
                dataout[1] <= 7'b0010010;
                dataout[2] <= 7'b0101111;
                dataout[3] <= 7'b0111111;    
            end else if (sw == 2'b01) begin
                dataout[0] <= hex2seg(rom_data);
                dataout[1] <= hex2seg(ram0_data);
                dataout[2] <= hex2seg(ram1_data[3:0]);
                dataout[3] <= hex2seg({3'b0, ram1_data[4]});
            end else begin
                dataout[0] <= 7'b1111111;
                dataout[1] <= 7'b1111111;
                dataout[2] <= 7'b1111111;
                dataout[3] <= 7'b1111111;
            end
            display_scan_counter <= display_scan_counter + 1;
//            if (display_scan_counter == 17'd99999) begin
            if (display_scan_counter == 17'd1) begin //For simulation of test bench
                display_scan_counter <= 17'd0;
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

module top_level (
    input wire btnC, 
    input wire clk,
    input wire [15:0] sw,
    output wire [3:0] an,
    output wire [6:0] seg
);
    wire [9:0] mem_addr;
    wire [3:0] rom_data_out, ram0_data_out;
    wire [4:0] ram1_data_out;
    wire [3:0] data_to_write_sw;
    wire write_en_sw, inc_en_sw;

    reg write_en_sw_prev, inc_en_sw_prev;
    wire write_pulse, inc_pulse;

    reg [3:0] ram0_data_in_update;
    reg ram0_write_en_update;
    wire [4:0] ram1_data_in;
    wire ram1_write_en;

    assign mem_addr = sw[13:4];
    assign data_to_write_sw = sw[3:0];
    assign write_en_sw = (sw[15:14] == 2'b10);
    assign inc_en_sw = (sw[15:14] == 2'b11);

    dist_mem_gen_0 rom_instance (
        .clk(clk),
        .a(mem_addr),
        .qspo(rom_data_out)
    );

    dist_mem_gen_1 ram0_instance (
        .clk(clk),
        .we(ram0_write_en_update),
        .a(mem_addr),
        .d(ram0_data_in_update),
        .qspo(ram0_data_out)
    );

    dist_mem_gen_2 ram1_instance (
        .clk(clk),
        .we(ram1_write_en),
        .a(mem_addr),
        .d(ram1_data_in),
        .qspo(ram1_data_out)
    );

    always @(posedge clk) begin
        write_en_sw_prev <= write_en_sw;
        inc_en_sw_prev <= inc_en_sw;
    end

    assign write_pulse = write_en_sw && !write_en_sw_prev;
    assign inc_pulse = inc_en_sw && !inc_en_sw_prev;

    assign ram1_data_in = rom_data_out + ram0_data_out;
    assign ram1_write_en = (sw[15:14] == 2'b01) || (sw[15:14] == 2'b10) || (sw[15:14] == 2'b11) ;

    always @(posedge clk) begin
        if (write_pulse) begin
            ram0_data_in_update <= data_to_write_sw;
            ram0_write_en_update <= 1'b1;
        end else if (inc_pulse) begin
            ram0_data_in_update <= ram0_data_out + 1;
            ram0_write_en_update <= 1'b1;
        end else begin
            ram0_write_en_update <= 1'b0;
        end
    end

    seven_segment_display seven_seg_inst(
        .clk(clk),
        .reset(btnC),
        .sw(sw[15:14]),
        .rom_data(rom_data_out),
        .ram0_data(ram0_data_out),
        .ram1_data(ram1_data_out),
        .an(an),
        .seg(seg)
    );

endmodule