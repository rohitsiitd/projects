# LITHP Parser and Typechecker – Assignment README

## Overview

This project implements a complete **frontend pipeline (Lexer, Parser, and Type Inference Engine)** for a LISP-like language called **LITHP** using **OCaml**, **ocamllex**, and **ocamlyacc**. 

The lexer tokenizes input expressions, the parser constructs an **Abstract Syntax Tree (AST)**, and the typechecker statically infers types, gracefully catching structural errors and invalid operations before runtime.

---

## Features

* **Comprehensive Tokenization & Parsing:**

  * Parentheses: `(` `)`
  * Arithmetic operators: `+ - * / mod`
  * Comparison operators: `= < > <= >= =/=`
  * Keywords: `atom`, `car`, `cdr`, `cons`, `cond`, `lambda`, `label`, `defun`, `not`, `and`, `or`
  * Boolean constants: `T`
  * Big integers (handled using custom `Bigint` module)
  * Quote symbol (`'`)
  
* **Strict Identifier Rules:** Identifiers (variable and function names) are strictly restricted to the regex `['a'-'z' 'A'-'Z']['a'-'z' 'A'-'Z' '0'-'9']* '.'?`. 
  * *Note: Built-in reserved keywords (like `car`, `cond`, `t`, `defun`) cannot be used as identifier names to prevent keyword shadowing errors.*

* **Robust Type Inference:**
  * Uses mutable type variables (`TVar`) to deduce function parameter types based on their usage body.
  * Distinguishes dynamically sized lists (`List(-1)`) from strictly sized lists (e.g., `List(3)`).
  * Supports higher-order functions (passing inline lambdas or curried functions).

---

## Type Specifications

The typechecker classifies LITHP expressions into the following internal OCaml types (`ltype`):

* **`TBigInt`**: Represents arbitrarily large integers.
* **`TBool`**: Represents boolean values (`t` and logical evaluations).
* **`TAtom`**: Represents generic LISP symbols or raw identifiers.
* **`TList of int`**: Represents a list of a specific length (e.g., `List(3)`). A length of `-1` acts as a dynamic wildcard for recursively processed lists.
* **`TFunc of tset list * ltype`**: Represents a function signature, mapping a list of parameter types to a single return type.
* **`TVar of tset ref`**: A mutable type reference used during inference to securely lock down parameter types based on their usage in the AST.
* **`TAny`**: A dynamic fallback type representing an expression that could be anything (used when static proof isn't possible, deferring to the runtime evaluator).

---

## Design Compromises (Typechecking)

Because LITHP is dynamically typed but statically analyzed here, we had to bridge the gap between static strictness and dynamic flexibility:

1. **Lack of Parametric Polymorphism (Generics):** 
   Without a full Hindley-Milner engine, functions like `(defun id (x) x)` infer their types as `TAny -> TAny` rather than `forall A. A -> A`. If you evaluate `(id 5)` in isolation, the typechecker prints `TAny`. However, this is mitigated by our contextual evaluation: if used in `(+ (id 5) 10)`, the context successfully forces the `TAny` fallback to resolve into an `Int`.

2. **Function Return Unions Collapse to `TAny`:** 
   While local expressions like `cond` support returning Union Types (e.g., `[Int; Bool]`), LITHP's function signature format (`TFunc`) strictly demands a single return type. If a function returns wildly divergent types across different branches, the typechecker safely collapses the return signature to `TAny`, deferring the final decision to the runtime evaluator.
   * *Exception:* If a function returns multiple differently-sized lists (e.g., `List(0)` and `List(5)`), the engine elegantly consolidates them into a dynamic wildcard `List(-1)`.

3. **Specific vs. Dynamic Lists (`TList (-1)`):**
   Functions like `car` and `cdr` expect dynamically sized lists (`List(-1)`). The typechecker employs smart loose-matching: if you pass a strict `'(1 2 3)` (which evaluates as `List(3)`), the function application rules gracefully accept it as valid for a `List(-1)` requirement.

4. **`car` always returns `TAny`:**
   Because generic lists in LITHP can contain mixed or dynamically typed elements, the typechecker cannot statically guarantee the type of the first element of an arbitrary list. Thus, `car` evaluates to the dynamic wildcard `TAny`, deferring the element's actual type resolution to the runtime evaluator
   expressions like ( + 2 ( car ' ( t 1 2 3) ) ) are therefore allowed.

---

## Project Structure

```
PROJECT/
│
|── ast.ml
|
|── test.lithp
|
|── main.ml
|
├── bigint.ml        # Big integer implementation
│
├── parser.mly         # Token type definitions with parsing logic
│
├── lexer.mll        # Lexer specification (ocamllex)
│
└── README.md
```

---


## How to Compile

This project includes a `Makefile` for streamlined compilation and testing. Run the following commands in your terminal:

```bash
make all      # Compiles all OCaml files and generates the 'tester' executable
make test     # Cleans, recompiles, and automatically runs 'tester' against test.lithp
make run      # Cleans, recompiles, and runs interactively from stdin (Press Ctrl+D for EOF)
make clean    # Deletes all temporary build files (*.cmo, *.cmi) and executables
```



---

## Author

Rohit Shakya
IIT Delhi
