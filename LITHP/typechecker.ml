open Ast
open Types
open Env


let check_ids lst = 
  List.fold_left (fun acc t -> match t with 
  | A (Id _) -> acc 
  | _ ->  false ) true lst 

let type_of_literal x =
  match x with 
  | A (Num _) -> [TBigInt] 
  | A (Sym "t") -> [TBool]
  | A (Sym _) | A (Id _) -> [TAtom]
  | L [] -> [TList 0 ; TBool]        
  | L lst -> [TList( List.length lst )]

let is_c_ad_r s =
  let len = String.length s in
  if len >= 4 && s.[0] = 'c' && s.[len - 1] = 'r' then
    let rec check_middle i =
      if i = len - 1 then true
      else if s.[i] = 'a' || s.[i] = 'd' then check_middle (i + 1)
      else false
    in
    check_middle 1
  else false

(* Main function *)
let rec type_exp (env : env) (e : exp) (force_type:ltype): tset =
  match e with

  (* ---------- ATOMS ---------- *)

  | A (Num _) -> 
      if force_type <> TBigInt && force_type <> TAny then failwith "Type Error: BigInt wasn't expected" else
      [TBigInt]

  | A (Sym "t") ->
      if force_type <> TBool && force_type <> TAny  then failwith "Type Error: Bool wasn't expected" else
      [TBool]

  | A (Id x) ->
      let current_types = lookup env x in
      (match current_types with
       | [TVar r] -> 
           (match !r with
            | [TAny] -> 
                if force_type <> TAny then (
                  (* Constrain the type in the environment permanently! *)
                  r := [force_type];
                  [force_type]
                ) else [TAny]
            | [existing_type] -> 
                if force_type = TAny || force_type = existing_type then [existing_type]
                else if force_type = TList (-1) && (match existing_type with TList _ -> true | _ -> false) then [existing_type]
                else failwith ("Type error: variable " ^ x ^ " used with conflicting types")
            | _ -> failwith "Unexpected multiple types in TVar"
           )
       | _ -> 
           if force_type = TAny then current_types
           else if contains force_type current_types then [force_type]  (*check for function later*)
           else if force_type = TList (-1) then
             let match_list = List.filter (fun t -> match t with TList _ -> true | _ -> false) current_types in
             if match_list <> [] then match_list else failwith ("Type error for variable " ^ x)
           else failwith ("Type error for variable " ^ x)
      )
     
  | A (Sym s) ->
      lookup env s          (*check this for preloading*)


  (* ---------- LIST EXPRESSIONS ---------- *)

  | L [] ->
      if force_type = TAny then [TBool; TList 0]
      else if contains force_type [TBool; TList 0] then [force_type]
      else if force_type = TList (-1) then [TList 0]
      else failwith "Type error: Expected empty list or bool to match context"


  | L (f :: args) ->
      match f with

      (* ---------- ARITHMETIC ---------- *)
      | A (Sym "+") | A (Sym "-") | A (Sym "*") | A (Sym "div") | A (Sym "mod") as op ->
          if force_type <> TBigInt && force_type <> TAny then
            failwith "Type error: Arithmetic operation must return BigInt";
            
          (match op, args with
           | A (Sym "+"), t 
           | A (Sym "*"), t-> if(List.length t )> 1 then () else failwith "Arithmetic operator arity mismatch"   (* n-ary *)
           | _, [_; _] -> ()                        (* binary *)
           | _, _ -> failwith "Arithmetic operator arity mismatch");
           
          let _ = List.map (fun x -> type_exp env x TBigInt) args in 
          [TBigInt]


      (* ---------- COMPARISON ---------- *)
      | A (Sym "=") | A (Sym "=/=") | A (Sym ">") | A (Sym "<") | A (Sym ">=") | A (Sym "<=") ->
          if force_type <> TBool && force_type <> TAny then
            failwith "Type error: Comparison must return Bool";
            
          if List.length args <> 2 then failwith "Comparison needs exactly 2 args";
          let _ = List.map (fun x -> type_exp env x TBigInt) args in 
          [TBool]

      (* ---------- BOOLEAN ---------- *)
      | A (Sym "not") ->
          if force_type <> TBool && force_type <> TAny then
            failwith "Type error: not returns Bool";
            
          if List.length args <> 1 then failwith "not needs only 1 arg";
          let _ = type_exp env (List.hd args) TBool in 
          [TBool]

      | A (Sym "or") | A (Sym "and") ->
          if force_type <> TBool && force_type <> TAny then
            failwith "Type error: and/or returns Bool";
            
          if List.length args <> 2 then failwith "and/or needs exactly 2 args";
          let _ = List.map (fun x -> type_exp env x TBool) args in 
          [TBool]


      (* ---------- LIST OPERATIONS ---------- *)
      | A (Sym "cons") ->
          (match args with
           | [x; y] -> 
               let _tx = type_exp env x TAny in
               let ty = type_exp env y (TList (-1)) in
               
               let list_size = 
                 match ty with
                 | [TList n] when n >= 0 -> n + 1
                 | [TAny] | [TList (-1)] -> -1 (* Fallback for unknown list sizes *)
                 | _ -> failwith "cons type error: second argument must be a list"
               in
               let res_type = TList list_size in
               
               if force_type = TAny || force_type = res_type then
                 [res_type]
               else
                 (match force_type, res_type with
                 | TList _, TList (-1) -> [force_type] (* Context demands specific size, but inferred size is unknown. Trust context. *)
                 | TList (-1), TList _ -> [res_type]   (* Context demands unknown size, but inferred is specific. *)
                 | TList _, TList _ -> failwith "cons type error: list size mismatch"
                 | _ -> failwith "cons type error: return type mismatch")
           | _ -> failwith "cons needs 2 args")

      | A (Sym "car") ->
          (match args with
           | [arg] ->
               let arg_types = type_exp env arg (TList (-1)) in

               let valid =
                 match arg_types with
                 | [TAny] | [TList (-1)] -> true       (*list might be empty check during runtime *)
                 | [TList n] when n > 0 -> true
                 | _ -> false
               in
               if not valid then failwith "car type error: expected non-empty list"
               else if force_type <> TAny then [force_type]    (*run time check needed for type of first element*)
               else [TAny]
           | _ -> failwith "car expects 1 argument")

      | A (Sym "cdr") ->
          (match args with
           | [x] ->
               let tx = type_exp env x (TList (-1)) in

               let res_type = 
                 match tx with
                 | [TList n] when n > 0 -> TList (n - 1)
                 | [TAny] | [TList (-1)] -> TList (-1)
                 | _ -> failwith "cdr type error: expected list"
               in
               
               if force_type = TAny || force_type = res_type || force_type = TList (-1) then [res_type]
               else (match force_type , res_type with 
               | TList n, TList (-1) when n >= 0 -> [force_type]
               | _ -> failwith "type mismatch for cdr")
           | _ -> failwith "cdr expects 1 argument")

      | A (Id s) when is_c_ad_r s ->
          if List.length args <> 1 then failwith (s ^ " expects exactly 1 argument");
          let len = String.length s in
          let rec expand i current_arg =
            if i = 0 then current_arg
            else
              let op = if s.[i] = 'a' then "car" else "cdr" in
              expand (i - 1) (L [A (Sym op); current_arg])
          in
          (* Evaluate inner-most letters first (e.g., right-to-left in string) *)
          let expanded_exp = expand (len - 2) (List.hd args) in
          type_exp env expanded_exp force_type

      (* ---------- BASIC LISP ---------- *)
      | A (Sym "atom") ->
          if force_type <> TBool && force_type <> TAny then failwith "atom returns Bool";
          if List.length args <> 1 then failwith "atom expects 1 argument";
          let _ = type_exp env (List.hd args) TAny in
          [TBool]

      | A (Sym "eq") ->
          if force_type <> TBool && force_type <> TAny then failwith "eq returns Bool";
          (match args with
           | [x; y] -> 
               let tx = type_exp env x TAny in
               let ty = type_exp env y TAny in
               
               let has_list ts = List.exists (fun t -> match t with TList _ -> true | _ -> false) ts in 
               
               if contains TAny tx || contains TAny ty then [TBool]
               else if (contains (TList (-1)) tx && has_list ty) || (contains (TList (-1)) ty && has_list tx) then [TBool]
             
               else if intersect tx ty = [] then
                 failwith "eq type error: operands have incompatible types"
               else [TBool]
           | _ -> failwith "eq expects exactly 2 arguments")

      | A (Sym "quote") ->
          (match args with
           | [x] -> 
               let t_lit = type_of_literal x in
               if force_type = TAny then t_lit
               else if contains force_type t_lit then [force_type]
               else if force_type = TList (-1) then
                 let match_list = List.filter (fun t -> match t with TList _ -> true | _ -> false) t_lit in
                 if match_list <> [] then match_list else failwith "quote return type mismatch"
               else failwith "quote return type mismatch"
           | _ -> failwith "quote expects 1 argument")


      | A (Sym "cond") ->
          if List.length args < 1 then failwith "cond expects at least 1 arg";
          let check_clause t =
            match t with
            | L [a; b] ->
                let _ = type_exp env a TBool in
                type_exp env b TAny
            | _ -> failwith "each cond clause must be a list of 2 elements"
          in
          let branch_types = List.map check_clause args in
          let possible_types = List.fold_left union [] branch_types in                  (*check for dynamic typing*)
          if force_type = TAny then possible_types
          else if contains force_type possible_types || contains TAny possible_types ||
              (match force_type with 
               | TList (-1) -> List.exists (function TList _ -> true | _ -> false) possible_types
               | TList _ -> contains (TList (-1)) possible_types 
               | _ -> false) then 
            [force_type]
          else failwith "type error in cond: no branch matches the expected context type"



      (* ---------- FUNCTIONS ---------- *)
      | A (Sym "lambda") ->           (*check for further improv*)
          (match args with
           | [L params; body] ->
               if not (check_ids params) then
                 failwith "lambda parameters must be identifiers";
                 
               let param_names =
                 List.map (function A (Id s) -> s | _ -> failwith "impossible") params
               in

               (* If the context expects a specific function signature, pass its return type down! *)
               let expected_ret_type =
                 match force_type with
                 | TFunc (_, ret_t) -> ret_t
                 | _ -> TAny
               in

               let new_env =
                 List.fold_left (fun acc p ->
                   (* Bind variables to mutable TVars so they can be constrained later! *)
                   (p, [TVar (ref [TAny])]) :: acc
                 ) env param_names
               in

               let body_type = type_exp new_env body expected_ret_type in
               let ret_type = 
                 match body_type with 
                 | [t] -> t 
                 | ts -> 
                     let has_list = List.exists (fun t -> match t with TList _ -> true | _ -> false) ts in
                     let only_list_or_bool = List.for_all (fun t -> match t with TList _ -> true | TBool -> true | _ -> false) ts in
                     if has_list && only_list_or_bool then TList (-1) else TAny
               in
               let param_types = List.map (fun p -> 
                 match lookup new_env p with
                 | [TVar r] -> !r
                 | ts -> ts
               ) param_names in
               let func_type = TFunc (param_types, ret_type) in
              (match force_type with 
                | TAny  
                | TFunc(_,_)-> [func_type]                              (*later check dynamically the function types*)
                | _ ->failwith "lambda return mismatch")
          

           | _ -> failwith "lambda expects exactly (params) and body")

      | A (Sym "label") ->
          (match args with
           | [A (Id fname); L (A (Sym "lambda") :: _) as lambda_exp] ->
               (* Pre-bind the function name in the environment for recursion *)
               let func_ref = ref [TAny] in
               let new_env = extend env fname [TVar func_ref] in
               
               let func_type = type_exp new_env lambda_exp force_type in
               func_ref := func_type; (* Update the recursive reference *)
               func_type
           | _ -> failwith "label expects exactly fname and a lambda expression")

      | A (Sym "defun") ->
          (match args with
           | [A (Id fname); L params; body] ->
               if not (check_ids params) then
                 failwith "defun parameters must be identifiers";
                 
               let param_names =
                 List.map (function A (Id s) -> s | _ -> failwith "impossible") params
               in

               (* Pre-bind the function name in the environment for recursion *)
               let func_ref = ref [TAny] in
               let env_with_func = extend env fname [TVar func_ref] in

               let new_env =
                 List.fold_left (fun acc p ->
                   (p, [TVar (ref [TAny])]) :: acc
                 ) env_with_func param_names
               in

               let body_type = type_exp new_env body TAny in
               let ret_type = 
                 match body_type with 
                 | [t] -> t 
                 | ts -> 
                     let has_list = List.exists (fun t -> match t with TList _ -> true | _ -> false) ts in
                     let only_list_or_bool = List.for_all (fun t -> match t with TList _ -> true | TBool -> true | _ -> false) ts in
                     if has_list && only_list_or_bool then TList (-1) else TAny
               in
               let param_types = List.map (fun p -> 
                 match lookup new_env p with
                 | [TVar r] -> !r
                 | ts -> ts
               ) param_names in
               let func_type = TFunc (param_types, ret_type) in
               
               func_ref := [func_type]; (* Update the recursive reference *)

               if force_type <> TAny && force_type <> func_type then failwith "defun return mismatch"
               else [func_type]

           | _ -> failwith "defun expects exactly fname, (params), and body")


      (* ---------- FUNCTION APPLICATION ---------- *)
      | _ ->
          let is_compatible expected arg =
            expected = TAny || arg = TAny || expected = arg ||
            (match expected, arg with 
             | TList (-1), TList _ -> true 
             | TList _, TList (-1) -> true 
             | _ -> false)
          in
          let check_args args param_types =
            List.map2 (fun arg expected_tset ->
              let arg_types = type_exp env arg TAny in
              let arg_type = match arg_types with | [t] -> t | _ -> TAny in
              match expected_tset with
              | [TVar r] ->
                  (match !r with
                   | [TAny] -> 
                       if arg_type <> TAny then r := [arg_type]
                   | [existing_type] -> 
                       if not (is_compatible existing_type arg_type) then
                         failwith "Argument type mismatch"
                   | _ -> ()
                  )
              | [expected_type] ->
                  if not (is_compatible expected_type arg_type) then
                    failwith "Argument type mismatch"
              | _ -> ()
            ) args param_types
          in
          (match f with
           | A (Id func_name) ->
               let t_func = lookup env func_name in
               (match t_func with
                | [TFunc (param_types, ret_type)] ->
                    if List.length args <> List.length param_types then failwith "Function arity mismatch";
                    let _ = check_args args param_types in
                    if force_type <> TAny && ret_type <> TAny && force_type <> ret_type then failwith "Function application return type mismatch";
                    if ret_type = TAny && force_type <> TAny then [force_type]
                    else [ret_type]
                | [TAny] | [TVar _] -> 
                    let _ = List.map (fun arg -> type_exp env arg TAny) args in
                    if force_type <> TAny then [force_type] else [TAny]
                | _ -> failwith ("Expected function, got other type for " ^ func_name))
                
           | _ -> 
               let t_func = type_exp env f TAny in
               (match t_func with
                | [TFunc (param_types, ret_type)] ->
                    if List.length args <> List.length param_types then failwith "Arity mismatch in dynamic application";
                    let _ = check_args args param_types in
                    if force_type <> TAny && ret_type <> TAny && force_type <> ret_type then failwith "Application return mismatch";
                    if ret_type = TAny && force_type <> TAny then [force_type]
                    else [ret_type]
                | [TAny] | [TVar _] ->
                    let _ = List.map (fun arg -> type_exp env arg TAny) args in
                    if force_type <> TAny then [force_type] else [TAny]
                | _ -> 
                    let _ = List.map (fun arg -> type_exp env arg TAny) args in
                    failwith "Invalid function application: expected function"))