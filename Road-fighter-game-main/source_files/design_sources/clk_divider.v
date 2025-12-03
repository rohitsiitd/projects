`timescale 1ns / 1ps

module clk_divider #(
    parameter integer N = 4  // Must be even
)(
    input wire clk,
    output wire pclk
);
    
    integer count = 0;
    reg temp = 0;  

    always @(posedge clk) begin
        if (count == (N/2 - 1)) begin
            count <= 0;			 // removed the use of log2 as instructed
            temp  <= ~temp;
        end
        else begin
            count <= count + 1;
        end
    end

    assign pclk = temp;  

endmodule
