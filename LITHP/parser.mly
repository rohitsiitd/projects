%{
open Bigint
open Ast
%}


%token LPAREN RPAREN
%token APOSTROPHE
%token TRUE
%token PLUS SUB MUL DIV MOD
%token EQ GT LT GE LE NEQ
%token NOT AND OR
%token QUOTE ATOM EQP CAR CDR CONS COND
%token LAMBDA LABEL DEFUN
%token <Bigint.bigint> BIGINT
%token <string> IDENT
%token <string> CADR
%token EOF


%start main
%type <Ast.exp list > main

%%

/* Grammar */

main:
    elements EOF { $1 }
;

/* Expressions */

expr:
    atom { A $1 }
  | list { $1 }
  | APOSTROPHE expr { L [A (Sym "quote"); $2] }                   /* creates distinction between '(a b) and (a,b)  and to make it more LISP aligned*/
;

/* Atoms */

atom:
    BIGINT { Num $1 }
  | IDENT  { Id $1 }
  | CADR   { Id $1 }

  /* Syms */
  | PLUS { Sym "+" }
  | SUB  { Sym "-" }
  | MUL  { Sym "*" }
  | DIV  { Sym "div" }
  | MOD  { Sym "mod" }
  | EQ   { Sym "=" }
  | GT   { Sym ">" }
  | LT   { Sym "<" }
  | GE   { Sym ">=" }
  | LE   { Sym "<=" }
  | NEQ  { Sym "=/=" }
  | TRUE { Sym "t" }
  // | NIL  { Sym "false" }                                     
  /* keywords  */
  | QUOTE  { Sym "quote" }
  | ATOM   { Sym "atom" }
  | EQP    { Sym "eq" }
  | CAR    { Sym "car" }
  | CDR    { Sym "cdr" }
  | CONS   { Sym "cons" }
  | COND   { Sym "cond" }
  | LAMBDA { Sym "lambda" }
  | LABEL  { Sym "label" }
  | DEFUN  { Sym "defun" }
  | NOT { Sym "not" }
  | AND { Sym "and" }
  | OR  { Sym "or" }

;

/* List */

list:
    LPAREN elements RPAREN { L $2 }
;

/* Elements */

elements:
    { [] }
  | elements expr { $1 @ [$2] }
;

%%