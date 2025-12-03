`timescale 1ns / 1ps

module lfsr(
    input clk,
    input btnC,
    output reg [7:0] out
);
    wire feedback;
    parameter [7:0]seed=8'b11110011;                                 
    parameter  [7:0] left=8'd44;
    parameter  [7:0] right=8'd104;
    
    assign feedback=out[2]^out[4]^out[5]^out[7];

    reg [7:0] next_out;
    always @(posedge clk) begin
    if (btnC)
        next_out = left+seed%(right-left+1);
    else begin
        next_out = {out[6:0], feedback};
        if (next_out > right || next_out < left)
            next_out = left + (next_out % (right - left + 1));
    end
    out <= next_out;
end
    
endmodule


module Display_sprite #(
        // Size of signal to store  horizontal and vertical pixel coordinate
        parameter pixel_counter_width = 10,
        parameter OFFSET_BG_X = 200,
        parameter OFFSET_BG_Y = 150
    )
    (
        input clk,       
        input btnC, btnL, btnR,
        output HS, VS,
        output [11:0] vgaRGB
    );
    
    localparam bg1_width = 160;
    localparam bg1_height = 240;
    localparam main_car_width = 14;
    localparam main_car_height = 16;
    
    
    wire pixel_clock;
    wire [3:0] vgaRed, vgaGreen, vgaBlue;
    wire [pixel_counter_width-1:0] hor_pix, ver_pix;
    reg [11:0] output_color;
    reg [11:0] next_color;
    reg [15:0] bg_rom_addr;
    wire [11:0] bg_color;
    wire [11:0] rival_color;                    //
    reg [7:0] car_rom_addr;
    reg [7:0] rival_rom_addr;               //
    wire [11:0] car_color;
    
    //Main display driver 
    VGA_driver #(
        .WIDTH(pixel_counter_width)
    )   display_driver (
        //DO NOT CHANGE, clock from basys 3 board
        .clk(clk),
        .vgaRed(vgaRed), .vgaGreen(vgaGreen), .vgaBlue(vgaBlue),
        //DO NOT CHANGE, VGA signal to basys 3 board
        .HS(HS),
        .VS(VS),
        .vgaRGB(vgaRGB),
        //Output pixel clocks
        .pixel_clock(pixel_clock),
        //Horizontal and Vertical pixel coordinates
        .hor_pix(hor_pix),
        .ver_pix(ver_pix)
    );
    lfsr lf_uut(
        .clk(clk),
        .btnC(btnC),
        .out(temp_x)                                
    );
    rival_car_rom rv(
        .clk(clk),
        .a(rival_rom_addr),
        .qspo(rival_color)                      
    );
    bg_rom bg1_rom (
        .clk(clk),
        .a(bg_rom_addr),
        .qspo(bg_color)
    );
    
    main_car_rom car1_rom (
        .clk(clk),
        .a(car_rom_addr),
        .qspo(car_color)
    );
    
    reg bg_on, car_on;
    reg rival_on;                                             
    reg [pixel_counter_width-1:0] car_x = OFFSET_BG_X + 70;
    reg [pixel_counter_width-1:0] car_y = 300;
    reg [pixel_counter_width-1:0] bg_y = 0;                     
    reg [pixel_counter_width-1:0] rival_x =OFFSET_BG_X+44;
    reg [pixel_counter_width-1:0] rival_y = OFFSET_BG_Y;
    localparam MOVE_COUNT_MAX = 22'd1680000;
//    localparam MOVE_COUNT_MAX = 10'd1;     //for simulation
    wire [7:0] temp_x;
    reg [21:0] move_counter = 0;        
//    reg [1:0] move_counter=0;      //for simulation
    reg collision;
    reg [21:0] scroll = 21'b0;          //40ms
//    reg [2:0]  scroll=0;                     //for simulation
    always @(posedge clk) begin        // add posedge btnc 
    if(btnC)begin       scroll<=0;   
            rival_x<=OFFSET_BG_X+temp_x;
            rival_y<=OFFSET_BG_Y;  
        end
        if(!collision) begin
            scroll <= scroll + 1;
            if(scroll==MOVE_COUNT_MAX)begin
                scroll <= 21'b0;
               if(rival_y==main_car_height+bg1_height+OFFSET_BG_Y)begin           
                   rival_x<= OFFSET_BG_X+temp_x;                                        
                   rival_y<=OFFSET_BG_Y;
               end
               else rival_y<=rival_y+2;          
                if(bg_y < bg1_height - 1 )               
                    bg_y <= bg_y + 1;
                else 
                    bg_y <= 0;
            end
        end
    end       
     
    wire [1:0] car_move;
    car_simulator car_movement(
        .clk(clk),
        .btnC(bntC),
        .btnL(btnL),
        .btnR(btnR),
        .collision(collision),
        .car_move(car_move)
    );

    
    always @(posedge clk) begin                                      
        if(btnC) begin
            car_x <= OFFSET_BG_X + 70;
            collision <= 0;
            move_counter<=0;         
                  
        end
       
            
        else begin
         if(((car_x>rival_x && main_car_width+rival_x>car_x) || (main_car_width+car_x>rival_x && rival_x>car_x)) && ((rival_y > car_y && rival_y < car_y + main_car_height) ||(car_y<rival_y-main_car_height && rival_y<car_y+2*main_car_height)))
            collision<=1;
            
             case(car_move)
                    2'b01: begin
                        if(car_x <= OFFSET_BG_X + 44) collision <= 1;
                        else 
                            if(move_counter==MOVE_COUNT_MAX) begin
                            car_x <= car_x - 1;
                            move_counter<=0;
                            end
                            else move_counter<=move_counter+1;                                                                           
                    end
                    2'b10: begin
                        if(car_x + main_car_width >= OFFSET_BG_X + 118)
                            collision <= 1;
                        else                        
                             if(move_counter==MOVE_COUNT_MAX) begin
                            car_x <= car_x + 1;
                            move_counter<=0;
                            end
                            else move_counter<=move_counter+1;                                
                    end
                    2'b00: begin
                        move_counter<=0;
                        car_x <= car_x;
                    end
                    default: car_x <= car_x;
                    
                endcase
                
        end   
    end


    always @ (posedge clk) begin : CAR_LOCATION
    if(btnC) begin rival_rom_addr<=(hor_pix-rival_x)+main_car_width*(ver_pix-rival_y+main_car_height); end
    
   if(hor_pix>=rival_x && hor_pix< (rival_x+main_car_width) && ver_pix<rival_y && main_car_height+ver_pix> rival_y) begin
       rival_rom_addr<=(hor_pix-rival_x)+main_car_width*(ver_pix-rival_y+main_car_height);
       rival_on<=1;
   end
   else  rival_on<=0;

        if (hor_pix >= car_x && hor_pix < (car_x + main_car_width) && ver_pix >= car_y && ver_pix < (car_y + main_car_height)) begin
            car_rom_addr <= (hor_pix - car_x) + (ver_pix - car_y)*main_car_width;
            car_on <= 1;
        end
        else begin
            car_on <= 0;
        end
    end
    
    always @ (posedge clk ) begin : BG_LOCATION
    if(btnC) bg_rom_addr <= (hor_pix - OFFSET_BG_X) + (ver_pix - OFFSET_BG_Y)*bg1_width;
        if (hor_pix >= 0 + OFFSET_BG_X && hor_pix < bg1_width + OFFSET_BG_X && ver_pix >= 0 + OFFSET_BG_Y && ver_pix < bg1_height  + OFFSET_BG_Y) begin
            bg_rom_addr <= (hor_pix - OFFSET_BG_X) + ((ver_pix - OFFSET_BG_Y - bg_y+bg1_height)%bg1_height)*bg1_width;
            bg_on <= 1;
            
        end
        else
            bg_on <= 0;
    end
    
    always @ (posedge clk) begin : MUX_VGA_OUTPUT
        if (car_on) begin
            if(car_color == 12'b101000001010) next_color <= bg_color;
            else next_color <= car_color;
        end

      else if (rival_on && bg_on) begin
           if(rival_color == 12'b101000001010) next_color <= bg_color;
           else next_color <= rival_color;
       end

        else if (bg_on) begin
            next_color <= bg_color;
        end
        else
            next_color <= 0;
    end
    
    always @ (posedge pixel_clock) begin
        output_color <= next_color;
    end
    
    assign vgaRed = output_color[11:8];
    assign vgaGreen = output_color[7:4];
    assign vgaBlue = output_color[3:0];
    
   
endmodule
