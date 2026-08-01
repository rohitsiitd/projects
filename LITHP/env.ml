open Types

(* Environment: maps identifiers to possible types *)
type env = (string * tset) list


(* ---------- Basic Operations ---------- *)

(* Empty environment *)
let empty : env = []


(* Lookup a variable/function in the environment *)
let rec lookup (e : env) (x : string) : tset =
  match e with
  | [] -> failwith ("Unbound identifier: " ^ x)
  | (y, t) :: rest ->
      if x = y then t
      else lookup rest x


(* Extend environment with a new binding *)
let extend (e : env) (x : string) (t : tset) : env =
  (x, t) :: e


(* Extend with multiple bindings (useful for lambda parameters) *)
let extend_list (e : env) (vars : string list) (ts : tset) : env =
  List.fold_left (fun acc v -> extend acc v ts) e vars


(* ---------- Optional: Debugging ---------- *)

let print_env (e : env) =
  List.iter (fun (x, ts) ->
    print_string (x ^ " -> ");
    Types.print_tset ts
  ) e