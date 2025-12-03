`timescale 1ns / 1ps
module tb();
    reg clk;
     reg btnc;
     reg [15:0] sw;
     wire [3:0] an;
    wire [6:0] seg;
    wire [1:0] led;

 linked_list#(.NUM_NODES(4)) dut(
 .clk(clk),
 .btnC(btnc),
 .sw(sw),
 .an(an),
 .seg(seg),
 .led(led)
 );

 always #5 clk=~clk;

 initial begin
 sw[15:0] = 16'b0;
 clk=0;
 btnc=1;#200
 btnc=0;#250        //reset

 sw[7:0]=8'b00000001;        //insert at head 1
 sw[15:13]=3'b100; # 100
 sw[15:13]=3'b000; # 100

  sw[7:0]=8'b00000011;# 100    //insert at head 3
 sw[15:13]=3'b100; # 100
 sw[15:13]=3'b000; # 200


  sw[7:0]=8'b00000111;        // insert at tail 7
   sw[15:13]=3'b101; # 200
 sw[15:13]=3'b000; # 200

    sw[7:0]=8'b00001111;#200    //insert at tail 15
 sw[15:13]=3'b101; # 200
 sw[15:13]=3'b000; # 200

   sw[7:0]=8'b00101111;         //overflow
    sw[15:13]=3'b100; # 200
 sw[15:13]=3'b000; # 200

     sw[15:13]=3'b111; #200      // traverse
     sw[15:13]=3'b000; # 800



     sw[7:0]=8'b00000001;
       sw[15:13]=3'b110;     #200       //delete
        sw[15:13]=3'b000; # 200

 sw[7:0]=8'b00000011;
   sw[15:13]=3'b110;   #200          //delete
    sw[15:13]=3'b000; # 200

  sw[7:0]=8'b00000111;
    sw[15:13]=3'b110;   #200          //delete
     sw[15:13]=3'b000; # 200

   sw[7:0]=8'b10000111;  //skips
     sw[15:13]=3'b110;  #200           //delete
      sw[15:13]=3'b000; # 200

  sw[7:0]=8'b00001111;
    sw[15:13]=3'b110;    #200         //delete
     sw[15:13]=3'b000; # 20
  sw[7:0]=8'b00001111;
    sw[15:13]=3'b110;    #20         //delete
     sw[15:13]=3'b000; # 20


  //underflow

  #1000
  $finish;
  end

  endmodule