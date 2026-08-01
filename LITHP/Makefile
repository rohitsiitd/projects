# Compiler variables
OCAMLC = ocamlc
OCAMLLEX = ocamllex
OCAMLYACC = ocamlyacc

# Target executable
TARGET = tester

.PHONY: all clean run test

# Default target to build the executable
all: $(TARGET)

# Strictly follow the required OCaml dependency compilation order
$(TARGET): lexer.mll parser.mly bigint.ml ast.ml types.ml env.ml typechecker.ml typecheck_main.ml
	$(OCAMLLEX) lexer.mll
	$(OCAMLYACC) parser.mly
	$(OCAMLC) -c bigint.ml
	$(OCAMLC) -c ast.ml
	$(OCAMLC) -c types.ml
	$(OCAMLC) -c env.ml
	$(OCAMLC) -c typechecker.ml
	$(OCAMLC) -c parser.mli
	$(OCAMLC) -c parser.ml
	$(OCAMLC) -c lexer.ml
	$(OCAMLC) -c typecheck_main.ml
	$(OCAMLC) -o $(TARGET) bigint.cmo ast.cmo types.cmo env.cmo typechecker.cmo parser.cmo lexer.cmo typecheck_main.cmo

# Clean all compiled, generated, and temporary files
clean:
	rm -f *.cmo *.cmi lexer.ml parser.ml parser.mli $(TARGET)

# Clean, build, and test using test.lithp in one go
test: clean all
	./$(TARGET) < test.lithp

# Clean, build, and run interactively (reads from stdin)
run: clean all
	./$(TARGET)
