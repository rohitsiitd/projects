open Ast
open Types
open Env
open Typechecker

let typecheck_and_print exps =
  let rec loop env lst =
    match lst with
    | [] -> ()
    | e :: es ->
        print_string "Expression: ";
        print_endline (Ast.debug_exp e);
        print_string "Type: ";
        try
          (* Typecheck the expression starting with TAny as the top-level forced type *)
          let t = Typechecker.type_exp env e Types.TAny in
          Types.print_tset t;
          print_newline ();
          
          (* If the expression was a top-level defun or label, extend the environment for subsequent expressions *)
          let next_env = match e with
            | Ast.L [Ast.A (Ast.Sym "defun"); Ast.A (Ast.Id fname); _; _] -> Env.extend env fname t
            | Ast.L [Ast.A (Ast.Sym "label"); Ast.A (Ast.Id fname); _] -> Env.extend env fname t
            | _ -> env
          in
          loop next_env es
        with
        | Failure msg ->
            print_endline ("Typechecking Error: " ^ msg);
            print_newline ();
            loop env es
  in
  loop Env.empty exps

let parse_and_typecheck (lexbuf : Lexing.lexbuf) =
  try
    let result = Parser.main Lexer.token lexbuf in
    print_endline "Parsing successful! Starting typechecking...\n";
    typecheck_and_print result
  with
  | Parsing.Parse_error ->
      let pos = lexbuf.lex_curr_p in
      Printf.printf "Syntax error at line %d, column %d\n"
        pos.pos_lnum (pos.pos_cnum - pos.pos_bol);
      exit (-1)

let () =
  let lexbuf = Lexing.from_channel stdin in
  parse_and_typecheck lexbuf