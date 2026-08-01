open Bigint

type atom =
  | Num of Bigint.bigint
  | Id of string
  | Sym of string

type exp =
  | A of atom
  | L of exp list

(* ---------- Pretty print Bigint ---------- *)

let b_pretty_print a =
  let Bigint.B (e, y) = a in
  let rec printer d =
    match d with
    | [] -> ""
    | x :: xs -> string_of_int x ^ printer xs
  in
  let value = printer y in
  match e with
  | Neg -> "-" ^ value
  | _ -> value

(* ---------- Debug printers ---------- *)

let rec debug_atom = function
  | Num n -> "Num(" ^ b_pretty_print n ^ ")"
  | Id s -> "Id(\"" ^ s ^ "\")"
  | Sym s -> "Sym(\"" ^ s ^ "\")"

let rec debug_exp = function
  | A a -> "A(" ^ debug_atom a ^ ")"
  | L lst ->
      "L[" ^ String.concat "; " (List.map debug_exp lst) ^ "]"

let rec helper a= match a with 
| [] -> ()
| x::xs -> print_endline( debug_exp x ); helper xs 