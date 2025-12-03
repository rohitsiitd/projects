`timescale 1ns / 1ps


module tb();
reg clk;
reg btnC;
wire [7:0]out;


 lfsr uut(
 .clk(clk),
 .btnC(btnC),
 .out(out));
 
 always #5 clk=~clk;
 
 initial begin
 clk=0;
 btnC=1; #20
 btnC=0;#100
 btnC=1; #20
 btnC=0; #20
 

 
 $finish ;
 end

endmodule
