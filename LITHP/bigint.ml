exception Invalid_bigint
  type mybool= 
  |T
  |F
  type sign=
            |Neg 
            | NonNeg

  type bigint=
  | B of sign*(int list)

(*helpers dont call them directly*)
  let bool_to_mybool x=
  if(x=true) then T else F

  let mybool_to_bool a =
    if(a=T) then true else false

  let my_or a b =
    let (x,y)=(mybool_to_bool a , mybool_to_bool b) in 
    bool_to_mybool (x||y)
   let rem_leadzeros a =
        let rec help b =
            match  b  with
            |[]->raise Invalid_bigint
            | x::xs -> if(x=0 && xs!=[]) then help xs
            else b
        in help a         

let convert v =             (*convert int to int list*)
  let rec help integer =          
    if integer = 0 then []
    else
      let d =abs integer mod 10 in
      d :: help (integer / 10)
  in
  if v = 0 then [0]
  else
    List.rev (help v)

  let  normalise a b =
  let a=rem_leadzeros a in                  (*pad 0's to make length equal of both int lists*)
  let b =rem_leadzeros b in
   let rec help x y=                 
    let l1=List.length x in 
   let l2 =List.length y in
   if( l1>l2) then help x (0::y)
   else if (l1<l2) then help (0::x) y 
   else (x,y)
    in help a b 

 
let zero_correction x =
  let B(a,b)=x in                                             (*convert neg 0 to nonneg 0*)
  if(a=Neg && b=[0]) then B(NonNeg,[0]) else x 


  let add a b= 
let (x,y)=normalise a b in 
 let x = List.rev x in                         (*add int list a and b*)
  let y = List.rev y in
let num=
 let rec add a b c =
    match a,b with  
    | [], _-> if(c>0) then [c] else []
    |_,[]->  if(c>0) then [c] else []             
    |x::xs ,y::ys-> 
        let d= (c+x+y) mod 10 in 
        let c2=(c+x+y)/10 in 
        d::(add xs ys c2)
in add x y 0    in
rem_leadzeros (List.rev num)

let greater_than a b=    
let a=rem_leadzeros a in 
let b=rem_leadzeros b in 
let x,y =normalise a b in 
let rec gt a b =          
    match a,b with                      (*a>b *)
    |[],[]->false
    |x::xs, y::ys ->if(x>y) then true
    else if (x<y) then false 
    else gt xs ys 
    |_,_->true
  in gt x y   

let  equal a b=          
let (a,b)=normalise a b in 
let rec help d e =
match d ,e  with                      (*a=b *)
    |[],[]->true
    |[],_->false
    |_,[]->false
    |x::xs, y::ys ->if(x!=y) then false 
    else help xs ys in help a b 


let sub d e  =    (*d and e  are magnitudes in normal form  st d>e *)
let v=
    let (x,y)=normalise d e in 
 let x = List.rev x in
  let y = List.rev y in
  let rec hel a b c =
    match a ,b with 
    |[],_->[]
    |_,[]->[]
    |x::xs, y::ys ->if(x>=y+c) then (x-y-c)::hel xs ys 0
    else (10+x-y-c)::hel xs ys 1
in hel x y 0  in
rem_leadzeros (List.rev  v)

      
let rec zeros i =
  if i <= 0 then []
  else 0 :: zeros (i - 1)

let extend a i =
  a @ zeros i



let mul a b =                   
let a=rem_leadzeros a in 
let b=rem_leadzeros b in                     (*multiplies two int list a and b *)
if(a=[0] || b=[0]) then [0]
else
let rec help1 x y i =match  y  with
|[]->[0]
| d::ds -> 
let part_sum=
    let rec help2 dig num k=
    match num with 
    | []->[0]
    | t::ts ->add (extend (convert (t*dig)) k ) (help2 dig ts (k-1))
  in help2 d x (List.length x -1) in
  add ( extend part_sum  i ) ( help1 x ds (i-1) )
in help1  a b (List.length b -1)



let div_rem a b=                    (*return quotient,remainder tuple*)
let (r,t)=
let a=rem_leadzeros a in 
let b=rem_leadzeros b in 
if(b=[0]) then raise Division_by_zero
else if(greater_than b a ) then ([0],a)
else 
  let rec help dividend divisor rem qlist=match dividend with
  |[]->(qlist,rem)
  |x::xs->
    let rem= add ([x]) (extend rem 1) in 
    let rec find_q r q =
            if not (greater_than divisor r )  then
              find_q (sub r divisor) (add q [1])
            else
              (q, r)
            in
            let q_digit,remainder=find_q rem [0] in
            help xs divisor remainder ( qlist@q_digit)

          in help a b [0] [] in 
          (rem_leadzeros r ,rem_leadzeros t)


(*main callable functions*)

let b_add x y =
  let value=                              
  match x, y with
  | B(c,d), B(e,f) ->
      if c = e then B(c, add d f)
      else if c = Neg then
        (if greater_than d f then B(Neg, sub d f)
         else B(NonNeg, sub f d))
      else
        (if greater_than f d then B(Neg, sub f d)
         else B(NonNeg, sub d f)) in 
         zero_correction value

let b_sub x y =
  let value=
  match x, y with
  | B(c,d), B(e,f) ->
      if(c=Neg && e=NonNeg) then B(Neg, add d f)
      else if (c=NonNeg && e=Neg) then B(NonNeg ,add d f)
      else if(greater_than d f ) then if (c=Neg) then B(Neg, sub d f) else B(NonNeg, sub d f )
    else if(e=Neg) then B(NonNeg, sub f d ) else B(Neg, sub f d) in 
    zero_correction value

let b_mul x y =
  let value=
  let B(x,y)=
   match x, y with
  | B(c,d), B(e,f) ->
    if(c=e) then B(NonNeg, mul d f )
    else B(Neg, mul d f ) in 
    if(y=[0]) then B(NonNeg,[0]) else B(x,y) in 
    zero_correction value

    let b_q_r x  y =
match x, y with
  | B(c,d), B(e,f) ->
     let (que,rem)=div_rem d f in 
     if(c=NonNeg) then (B(e,que),B(NonNeg,rem))
     else  if(e=Neg) then (B(NonNeg,add que [1]),B(NonNeg,sub que rem ))
     else (B(Neg,add que [1]),B(NonNeg,sub que rem ))
    
let b_quotient a b=
let value=
let (x,y)=b_q_r a b in x in zero_correction value

let b_abs a =
let B(x,y)=a in B(NonNeg, rem_leadzeros y)

     
let b_remainder a b=
let value=
let (x,y)=b_q_r a b in y in zero_correction value

let b_unary_neg a=
let value=
match  a  with
| B(c,d)->if(c=Neg) then B(NonNeg,d) else B(Neg,d) in zero_correction value

let b_equal a b=
let B(x,y)=a in 
let B(c,d)=b in 
if(c=x && equal y d ) then T
else F

let b_greaterthan a b=
let B(x,y)=a in 
let B(c,d)=b in 
if(x=Neg && c=NonNeg) then F
else if (x=NonNeg && c=Neg) then T
else if(x=Neg && c=Neg ) then let check=greater_than d y in bool_to_mybool(check)
else let check=greater_than y d in bool_to_mybool check

let b_lessthan a b=
  b_greaterthan b a 

let b_greater_or_equal a b=     (*a>=b*)
 my_or (b_greaterthan a b) ( b_equal a b) 
 
 let b_less_or_equal  a b =       (*a<=b*)
 my_or (b_greaterthan b a ) ( b_equal a b) 

 let b_pretty_print a =
  let B(e,y)=a in
  if(e=Neg) then print_string "-" else print_string "";
    let rec printer d =
      match  d with
      | [] -> ()
      |x::xs -> print_int x; printer xs 
    in printer y  

    let b_convert x=                    
    let sign=if(x<0) then Neg else NonNeg in 
    let d =convert x in 
    B(sign ,d )
    
let bigint_of_string s =					(*Newly added Not in the previous assignment*)
  if s = "" then raise Invalid_bigint
  else
    let len = String.length s in

    (* detect sign *)
    let sign, start =
      if s.[0] = '-' then (Neg, 1)
      else (NonNeg, 0)
    in

    (* convert characters to digit list *)
    let rec build i acc =
      if i >= len then List.rev acc
      else
        let c = s.[i] in
        if c >= '0' && c <= '9' then
          let digit = (Char.code c) - (Char.code '0') in
          build (i + 1) (digit :: acc)
        else
          raise Invalid_bigint
    in

    let digits = build start [] in

    if digits = [] then raise Invalid_bigint
    else
      let digits = rem_leadzeros digits in
      zero_correction (B(sign, digits))    
    
