open Bigint

(* Basic types in LITHP *)
type ltype =
  | TBigInt
  | TBool
  | TAny
  | TAtom
  | TList of int
  | TFunc of tset list * ltype
  | TVar of tset ref
and tset = ltype list


(* ---------- Utility Functions ---------- *)

(* Check if a type exists in a set *)
let rec contains t ts =
  match ts with
  | [] -> false
  | x :: xs -> x = t || contains t xs


(* Remove duplicates from a type set *)
let rec remove_duplicates ts =
  match ts with
  | [] -> []
  | x :: xs ->
      if contains x xs then remove_duplicates xs
      else x :: remove_duplicates xs


(* Union of two type sets *)
let union ts1 ts2 =
  remove_duplicates (ts1 @ ts2)


(* Intersection of two type sets *)
let intersect ts1 ts2 =
  List.filter (fun t -> contains t ts2) ts1


(* ---------- Pretty Printing (for debugging) ---------- *)

let rec to_string t =
  match t with
  | TBigInt -> "Int"
  | TBool -> "Bool"
  |TAny -> "TAny"
  |TAtom ->"TAtom"
  | TList n -> "List(" ^ string_of_int n ^ ")"
  | TVar r -> String.concat " | " (List.map to_string !r)
  | TFunc (args_types, t) ->
      let format_tset ts = 
        if ts = [] then "[]" 
        else "[" ^ String.concat ", " (List.map to_string ts) ^ "]" 
      in
      let args_str = String.concat " * " (List.map format_tset args_types) in
      let args_str = if args_str = "" then "()" else args_str in
      "(" ^ args_str ^ ") -> " ^ to_string t


let print_tset ts =
  let strs = List.map to_string ts in
  print_string "[ ";
  List.iter (fun s -> print_string (s ^ " ")) strs;
  print_endline "]"