package com.codevista.compiler.pipeline.service;

import com.codevista.compiler.pipeline.model.AstNodeDto;
import com.sun.source.tree.*;
import com.sun.source.util.JavacTask;
import com.sun.source.util.SourcePositions;
import com.sun.source.util.Trees;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.SimpleJavaFileObject;
import javax.tools.ToolProvider;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Generates an authentic Abstract Syntax Tree (AST) using the host OpenJDK Java Compiler API.
 * Preserves hierarchical syntax structure with exact source line and column correlations.
 */
@Service
public class JavaAstService {

    private static final Logger log = LoggerFactory.getLogger(JavaAstService.class);

    public AstNodeDto parseAst(String sourceCode, String className) {
        if (sourceCode == null || sourceCode.isBlank()) {
            return new AstNodeDto("ast-root", "EMPTY", "Empty Source", 1, 1, 1, 1, "No source code provided.", List.of());
        }

        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) {
            log.warn("System JavaCompiler is null. Returning fallback AST root.");
            return new AstNodeDto("ast-root", "UNAVAILABLE", "Compiler Unavailable", 1, 1, 1, 1, "Host environment did not expose javax.tools.JavaCompiler.", List.of());
        }

        String safeName = (className != null && !className.isBlank()) ? className : "Main";
        SimpleJavaFileObject fileObject = new SimpleJavaFileObject(
                URI.create("string:///" + safeName + ".java"),
                JavaFileObject.Kind.SOURCE
        ) {
            @Override
            public CharSequence getCharContent(boolean ignoreEncodingErrors) {
                return sourceCode;
            }
        };

        try {
            JavacTask task = (JavacTask) compiler.getTask(null, null, null, List.of("-proc:none"), null, List.of(fileObject));
            Iterable<? extends CompilationUnitTree> compilationUnits = task.parse();
            Trees trees = Trees.instance(task);
            SourcePositions sourcePositions = trees.getSourcePositions();

            for (CompilationUnitTree cu : compilationUnits) {
                LineMap lineMap = cu.getLineMap();
                AtomicInteger idGen = new AtomicInteger(1);
                return convertCompilationUnit(cu, lineMap, sourcePositions, idGen, safeName);
            }
        } catch (Exception e) {
            log.error("Failed to parse AST via JavacTask: {}", e.getMessage(), e);
            return new AstNodeDto("ast-error", "PARSE_ERROR", "Syntax Parsing Error", 1, 1, 1, 1, "Javac parser reported syntax defects: " + e.getMessage(), List.of());
        }

        return new AstNodeDto("ast-root", "EMPTY", "Empty AST", 1, 1, 1, 1, "Parsed without root unit.", List.of());
    }

    private AstNodeDto convertCompilationUnit(
            CompilationUnitTree cu,
            LineMap lineMap,
            SourcePositions sourcePositions,
            AtomicInteger idGen,
            String defaultName
    ) {
        List<AstNodeDto> children = new ArrayList<>();

        if (cu.getPackage() != null) {
            children.add(convertNode(cu.getPackage(), cu, lineMap, sourcePositions, idGen));
        }

        if (cu.getImports() != null) {
            for (ImportTree imp : cu.getImports()) {
                children.add(convertNode(imp, cu, lineMap, sourcePositions, idGen));
            }
        }

        if (cu.getTypeDecls() != null) {
            for (Tree typeDecl : cu.getTypeDecls()) {
                children.add(convertNode(typeDecl, cu, lineMap, sourcePositions, idGen));
            }
        }

        int startLine = 1;
        int startCol = 1;
        int endLine = 1;
        int endCol = 1;
        long startPos = sourcePositions.getStartPosition(cu, cu);
        long endPos = sourcePositions.getEndPosition(cu, cu);

        if (lineMap != null && startPos >= 0) {
            startLine = (int) lineMap.getLineNumber(startPos);
            startCol = (int) lineMap.getColumnNumber(startPos);
        }
        if (lineMap != null && endPos >= 0) {
            endLine = (int) lineMap.getLineNumber(endPos);
            endCol = (int) lineMap.getColumnNumber(endPos);
        }

        return new AstNodeDto(
                "node-" + idGen.getAndIncrement(),
                "COMPILATION_UNIT",
                "CompilationUnit (" + defaultName + ".java)",
                startLine,
                startCol,
                Math.max(endLine, startLine),
                Math.max(endCol, startCol),
                "Root Abstract Syntax Tree representing the parsed compilation unit.",
                children
        );
    }

    private AstNodeDto convertNode(
            Tree tree,
            CompilationUnitTree cu,
            LineMap lineMap,
            SourcePositions sourcePositions,
            AtomicInteger idGen
    ) {
        if (tree == null) return null;

        String id = "node-" + idGen.getAndIncrement();
        int startLine = 1;
        int startCol = 1;
        int endLine = 1;
        int endCol = 1;

        long startPos = sourcePositions.getStartPosition(cu, tree);
        long endPos = sourcePositions.getEndPosition(cu, tree);

        if (lineMap != null && startPos >= 0) {
            startLine = (int) lineMap.getLineNumber(startPos);
            startCol = (int) lineMap.getColumnNumber(startPos);
        }
        if (lineMap != null && endPos >= 0) {
            endLine = (int) lineMap.getLineNumber(endPos);
            endCol = (int) lineMap.getColumnNumber(endPos);
        }
        if (endLine < startLine) endLine = startLine;
        if (endLine == startLine && endCol < startCol) endCol = startCol;

        List<AstNodeDto> children = new ArrayList<>();
        String kind = tree.getKind().name();
        String label = tree.getKind().name();
        String details = "Syntax construct emitted by parser.";

        if (tree instanceof ClassTree ct) {
            kind = "CLASS";
            label = "Class " + ct.getSimpleName();
            details = "Class declaration defining fields, constructors, and methods.";
            if (ct.getMembers() != null) {
                for (Tree m : ct.getMembers()) {
                    AstNodeDto child = convertNode(m, cu, lineMap, sourcePositions, idGen);
                    if (child != null) children.add(child);
                }
            }
        } else if (tree instanceof MethodTree mt) {
            kind = "METHOD";
            label = "Method " + mt.getName() + "()";
            details = "Method declaration with signature and execution body.";
            if (mt.getParameters() != null) {
                for (VariableTree param : mt.getParameters()) {
                    AstNodeDto pNode = convertNode(param, cu, lineMap, sourcePositions, idGen);
                    if (pNode != null) children.add(pNode);
                }
            }
            if (mt.getBody() != null) {
                AstNodeDto bNode = convertNode(mt.getBody(), cu, lineMap, sourcePositions, idGen);
                if (bNode != null) children.add(bNode);
            }
        } else if (tree instanceof VariableTree vt) {
            kind = "VARIABLE";
            label = "Variable " + vt.getName();
            details = "Variable declaration with type and optional initializer.";
            if (vt.getInitializer() != null) {
                AstNodeDto initNode = convertNode(vt.getInitializer(), cu, lineMap, sourcePositions, idGen);
                if (initNode != null) children.add(initNode);
            }
        } else if (tree instanceof BlockTree bt) {
            kind = "BLOCK";
            label = "Block { ... }";
            details = "Compound statement sequence within a distinct scope.";
            if (bt.getStatements() != null) {
                for (StatementTree st : bt.getStatements()) {
                    AstNodeDto sNode = convertNode(st, cu, lineMap, sourcePositions, idGen);
                    if (sNode != null) children.add(sNode);
                }
            }
        } else if (tree instanceof IfTree it) {
            kind = "IF_STATEMENT";
            label = "If Branch";
            details = "Conditional control flow branch testing a guard condition.";
            if (it.getCondition() != null) {
                children.add(convertNode(it.getCondition(), cu, lineMap, sourcePositions, idGen));
            }
            if (it.getThenStatement() != null) {
                children.add(convertNode(it.getThenStatement(), cu, lineMap, sourcePositions, idGen));
            }
            if (it.getElseStatement() != null) {
                children.add(convertNode(it.getElseStatement(), cu, lineMap, sourcePositions, idGen));
            }
        } else if (tree instanceof ForLoopTree flt) {
            kind = "FOR_LOOP";
            label = "For Loop";
            details = "Counted loop with initializer, termination condition, and step update.";
            for (StatementTree init : flt.getInitializer()) {
                children.add(convertNode(init, cu, lineMap, sourcePositions, idGen));
            }
            if (flt.getCondition() != null) children.add(convertNode(flt.getCondition(), cu, lineMap, sourcePositions, idGen));
            for (ExpressionStatementTree up : flt.getUpdate()) {
                children.add(convertNode(up, cu, lineMap, sourcePositions, idGen));
            }
            if (flt.getStatement() != null) children.add(convertNode(flt.getStatement(), cu, lineMap, sourcePositions, idGen));
        } else if (tree instanceof EnhancedForLoopTree eflt) {
            kind = "FOR_EACH_LOOP";
            label = "Enhanced For-Each Loop";
            details = "Iteration loop traversing elements of an array or Iterable collection.";
            if (eflt.getVariable() != null) children.add(convertNode(eflt.getVariable(), cu, lineMap, sourcePositions, idGen));
            if (eflt.getExpression() != null) children.add(convertNode(eflt.getExpression(), cu, lineMap, sourcePositions, idGen));
            if (eflt.getStatement() != null) children.add(convertNode(eflt.getStatement(), cu, lineMap, sourcePositions, idGen));
        } else if (tree instanceof WhileLoopTree wlt) {
            kind = "WHILE_LOOP";
            label = "While Loop";
            details = "Repetitive loop executing statements while guard condition remains true.";
            if (wlt.getCondition() != null) children.add(convertNode(wlt.getCondition(), cu, lineMap, sourcePositions, idGen));
            if (wlt.getStatement() != null) children.add(convertNode(wlt.getStatement(), cu, lineMap, sourcePositions, idGen));
        } else if (tree instanceof ExpressionStatementTree est) {
            kind = "EXPRESSION_STMT";
            label = "Expression Statement";
            details = "Statement executing an expression for its side-effects.";
            if (est.getExpression() != null) {
                children.add(convertNode(est.getExpression(), cu, lineMap, sourcePositions, idGen));
            }
        } else if (tree instanceof MethodInvocationTree mit) {
            kind = "METHOD_INVOCATION";
            label = "Call: " + mit.getMethodSelect();
            details = "Method call dispatching arguments to target function.";
            for (ExpressionTree arg : mit.getArguments()) {
                children.add(convertNode(arg, cu, lineMap, sourcePositions, idGen));
            }
        } else if (tree instanceof BinaryTree bnt) {
            kind = "BINARY_EXPRESSION";
            label = "Binary: " + bnt.getKind().name();
            details = "Binary expression combining left and right operands.";
            if (bnt.getLeftOperand() != null) children.add(convertNode(bnt.getLeftOperand(), cu, lineMap, sourcePositions, idGen));
            if (bnt.getRightOperand() != null) children.add(convertNode(bnt.getRightOperand(), cu, lineMap, sourcePositions, idGen));
        } else if (tree instanceof AssignmentTree at) {
            kind = "ASSIGNMENT";
            label = "Assign: " + at.getVariable();
            details = "Assignment binding evaluated value into variable.";
            if (at.getExpression() != null) children.add(convertNode(at.getExpression(), cu, lineMap, sourcePositions, idGen));
        } else if (tree instanceof CompoundAssignmentTree cat) {
            kind = "COMPOUND_ASSIGNMENT";
            label = "Compound: " + cat.getVariable() + " " + cat.getKind().name();
            details = "Combined operation and variable store.";
            if (cat.getExpression() != null) children.add(convertNode(cat.getExpression(), cu, lineMap, sourcePositions, idGen));
        } else if (tree instanceof ReturnTree rt) {
            kind = "RETURN";
            label = "Return Statement";
            details = "Terminates current stack frame execution and returns value.";
            if (rt.getExpression() != null) children.add(convertNode(rt.getExpression(), cu, lineMap, sourcePositions, idGen));
        } else if (tree instanceof LiteralTree lt) {
            kind = "LITERAL";
            label = "Literal: " + lt.getValue();
            details = "Constant literal embedded in program.";
        } else if (tree instanceof IdentifierTree idt) {
            kind = "IDENTIFIER";
            label = "Ident: " + idt.getName();
            details = "Reference to declared variable or type.";
        } else {
            label = tree.getKind().name() + " (" + tree.toString().lines().findFirst().orElse("") + ")";
            if (label.length() > 40) label = label.substring(0, 37) + "...";
        }

        return new AstNodeDto(id, kind, label, startLine, startCol, endLine, endCol, details, children);
    }
}
