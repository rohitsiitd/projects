`timescale 1ns / 1ps

module top_level_reset_tb;
    reg btnC;
    reg clk;
    reg [15:0] sw;
    
    wire [3:0] an;
    wire [6:0] seg;

    top_level dut (
        .btnC(btnC),
        .clk(clk),
        .sw(sw),
        .an(an),
        .seg(seg)
    );
    
    initial clk = 0;
    always #5 clk = ~clk;

    initial begin
        btnC = 1'b0;
        sw = 16'b0;
        btnC = 1;
        #10;
        btnC = 0;
        #1000;
    end
endmodule