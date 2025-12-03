`timescale 1ns / 1ps

module car_simulator(
    input wire clk,
    input wire btnC, btnL, btnR,
    input wire collision,
    output reg [1:0] car_move // 00 for idle, 01 for left and 10 for right 
    );
    
    localparam [2:0]
        START = 3'b000,
        IDLE = 3'b001,
        LEFT_CAR = 3'b010,
        RIGHT_CAR = 3'b011,
        COLLIDE = 3'b100;

    reg [2:0] current_state = START;
    reg [2:0] next_state;
    always @(*) begin
        next_state = current_state;
       if(!btnL && !btnR) car_move = 2'b0;
        case(current_state)
            START: begin
                next_state = IDLE;
            end
            IDLE: begin
                if (!collision) begin
                    if(btnL) begin
                        next_state = LEFT_CAR;
                    end else if (btnR) begin
                        next_state = RIGHT_CAR;
                    end
                end else begin
                    next_state = collision;
                end
            end
            LEFT_CAR: begin
                car_move = 2'b01;
                if (collision) begin
                    next_state = COLLIDE;
                end else if (btnL) begin
                    next_state = LEFT_CAR;
                end else if (btnR) begin
                    next_state = RIGHT_CAR;
                end else begin
                    next_state = IDLE;
                end;
            end
            RIGHT_CAR: begin
                car_move = 2'b10;
                if (collision) begin
                    next_state = COLLIDE;
                end else if (btnL) begin
                    next_state = LEFT_CAR;
                end else if (btnR) begin
                    next_state = RIGHT_CAR;
                end else begin
                    next_state = IDLE;
                end;
            end
            COLLIDE: begin 
                car_move = 2'b11;  
                if(!collision) next_state = START;
                else next_state = COLLIDE;          //
            end
            default: next_state = IDLE;
        endcase                 
    end
    
    always @(posedge clk or posedge btnC ) begin
        if(btnC) begin     
            current_state <= START;
        end
        else begin
            current_state <= next_state;
        end
    end
endmodule
