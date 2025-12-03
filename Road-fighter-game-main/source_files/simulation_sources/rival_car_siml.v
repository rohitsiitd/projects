`timescale 1ns / 1ps


module tb();
reg clk;
reg btnC;
reg btnL;
reg btnR;
wire [11:0]vgaRGB;
wire HS;
wire VS;

 Display_sprite uut(
 .clk(clk),
 .btnC(btnC),
 .btnL(btnL),
 .btnR(btnR),
 .HS(HS),
 .VS(VS),
 .vgaRGB(vgaRGB));
 
 always #5 clk=~clk;
 
 initial begin
 clk=0;
 btnL=0;
 btnR=0;
 btnC=1; #20
 btnC=0;
 
 
 end

endmodule
