`timescale 1ns / 1ps

module normal_tb();
    reg clk;
    reg btnC;
    reg [15:0] sw;
    wire [3:0] an;
    wire [6:0] seg;

    top_level uut (
        .clk(clk),
        .btnC(btnC),
        .sw(sw),
        .an(an),
        .seg(seg)
    );

    always #5 clk = ~clk;

    initial begin
        clk = 0;
        btnC = 0;
        sw[3:0] = 4'b0;
        sw[13:4] = 10'b0000000010; 
        sw[15:14] = 2'b01;
        #200;
        // Changing value stored at Address: 2 to 6.
        sw[3:0] = 4'b0110;
        #20;
        sw[13:4] = 10'b0000000010;
        #30;
        sw[15:14] = 2'b10;
        #30;
        sw[15:14] = 2'b01;
        #200;
        // Incrementing value stored at address : 2 by 2.
        sw[15:14] = 2'b11;
        #20
        sw[15:14] = 2'b00;
        #10
        sw[15:14] = 2'b11;
        #20
        sw[15:14] = 2'b00;
        #10
        sw[15:14] = 2'b01;
        
        
        
	#1000;

        $stop;
    end
endmodule