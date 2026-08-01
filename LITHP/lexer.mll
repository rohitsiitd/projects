{
open Bigint
open Parser
}

let ident = ['a'-'z' 'A'-'Z']['a'-'z' 'A'-'Z' '0'-'9']* '.'?
let cadr= 'c'['a' 'd' ]+ 'r'


  rule token =parse 
  | [' ' '\t' '\n']+ { token lexbuf}
  | ';' [^ '\n']* { token lexbuf }
  (* | "()" {NIL}                  *)
  | "(" {LPAREN}
  | ")" {RPAREN}
  | "'" {APOSTROPHE}
  | "t" {TRUE}
  | "+" {PLUS}
  | "-" {SUB}
  | "*" {MUL}
  | ">="  {GE}
  | "<="  {LE}
  | "=/=" {NEQ}
  | "div" {DIV}
  | "mod" {MOD}
  | "="   {EQ}
  | ">"   {GT}
  | "<"   {LT}
  | "quote" {QUOTE}
  | "atom"  {ATOM}
  | "eq"    {EQP}
  | "car" {CAR}
  | "cdr" {CDR}
  | "cons" {CONS}
  | "cond" {COND}
  | "lambda" {LAMBDA}
  | "label"  {LABEL}
  | "defun"  {DEFUN}
  | "not"    {NOT}
  | "and"    {AND}
  | "or"     {OR}
  | ['0'-'9']+ as s   {BIGINT (Bigint.bigint_of_string (s))}
  | cadr as s  {CADR  s }
  | ident as s {IDENT  s  }
  | eof {EOF}
  | _ { failwith "Unknown character" }
