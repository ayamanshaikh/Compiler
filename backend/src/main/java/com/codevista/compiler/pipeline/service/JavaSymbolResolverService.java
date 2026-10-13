package com.codevista.compiler.pipeline.service;

import com.codevista.compiler.pipeline.model.CompilerSymbol;
import com.sun.source.tree.*;
import com.sun.source.util.JavacTask;
import com.sun.source.util.SourcePositions;
import com.sun.source.util.Trees;
import org.springframework.stereotype.Service;

import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.SimpleJavaFileObject;
import javax.tools.ToolProvider;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;

/**
 * Resolves declared symbols, types, and scopes across the compilation unit.
 */
@Service
public class JavaSymbolResolverService {

    public List<CompilerSymbol> resolveSymbols(String sourceCode, String className) {
        List<CompilerSymbol> symbols = new ArrayList<>();
        if (sourceCode == null || sourceCode.isBlank()) {
            return symbols;
        }

        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) {
            return symbols;
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
                for (Tree typeDecl : cu.getTypeDecls()) {
                    if (typeDecl instanceof ClassTree ct) {
                        resolveClassSymbols(ct, cu, lineMap, sourcePositions, "GLOBAL", symbols);
                    }
                }
            }
        } catch (Exception ignored) {
            // If syntax errors occur, partial symbols will still be retained
        }

        return symbols;
    }

    private void resolveClassSymbols(
            ClassTree ct,
            CompilationUnitTree cu,
            LineMap lineMap,
            SourcePositions sourcePositions,
            String parentScope,
            List<CompilerSymbol> symbols
    ) {
        String className = ct.getSimpleName().toString();
        int line = getLine(cu, ct, lineMap, sourcePositions);
        int col = getCol(cu, ct, lineMap, sourcePositions);

        symbols.add(new CompilerSymbol(
                className,
                "CLASS",
                className,
                parentScope,
                line,
                col,
                null
        ));

        String classScope = "CLASS:" + className;

        for (Tree member : ct.getMembers()) {
            if (member instanceof MethodTree mt) {
                resolveMethodSymbols(mt, cu, lineMap, sourcePositions, classScope, symbols);
            } else if (member instanceof VariableTree vt) {
                int vLine = getLine(cu, vt, lineMap, sourcePositions);
                int vCol = getCol(cu, vt, lineMap, sourcePositions);
                String initStr = vt.getInitializer() != null ? vt.getInitializer().toString() : null;
                symbols.add(new CompilerSymbol(
                        vt.getName().toString(),
                        "FIELD",
                        vt.getType() != null ? vt.getType().toString() : "var",
                        classScope,
                        vLine,
                        vCol,
                        initStr
                ));
            }
        }
    }

    private void resolveMethodSymbols(
            MethodTree mt,
            CompilationUnitTree cu,
            LineMap lineMap,
            SourcePositions sourcePositions,
            String classScope,
            List<CompilerSymbol> symbols
    ) {
        String methodName = mt.getName().toString();
        int line = getLine(cu, mt, lineMap, sourcePositions);
        int col = getCol(cu, mt, lineMap, sourcePositions);
        String returnType = mt.getReturnType() != null ? mt.getReturnType().toString() : "void";

        symbols.add(new CompilerSymbol(
                methodName,
                "METHOD",
                returnType,
                classScope,
                line,
                col,
                null
        ));

        String methodScope = classScope + " -> METHOD:" + methodName;

        if (mt.getParameters() != null) {
            for (VariableTree param : mt.getParameters()) {
                int pLine = getLine(cu, param, lineMap, sourcePositions);
                int pCol = getCol(cu, param, lineMap, sourcePositions);
                symbols.add(new CompilerSymbol(
                        param.getName().toString(),
                        "PARAMETER",
                        param.getType() != null ? param.getType().toString() : "var",
                        methodScope,
                        pLine,
                        pCol,
                        null
                ));
            }
        }

        if (mt.getBody() != null) {
            resolveBlockVariables(mt.getBody(), cu, lineMap, sourcePositions, methodScope, symbols);
        }
    }

    private void resolveBlockVariables(
            BlockTree bt,
            CompilationUnitTree cu,
            LineMap lineMap,
            SourcePositions sourcePositions,
            String currentScope,
            List<CompilerSymbol> symbols
    ) {
        if (bt.getStatements() == null) return;

        for (StatementTree st : bt.getStatements()) {
            if (st instanceof VariableTree vt) {
                int vLine = getLine(cu, vt, lineMap, sourcePositions);
                int vCol = getCol(cu, vt, lineMap, sourcePositions);
                String initStr = vt.getInitializer() != null ? vt.getInitializer().toString() : null;
                symbols.add(new CompilerSymbol(
                        vt.getName().toString(),
                        "VARIABLE",
                        vt.getType() != null ? vt.getType().toString() : "var",
                        currentScope,
                        vLine,
                        vCol,
                        initStr
                ));
            } else if (st instanceof BlockTree nested) {
                resolveBlockVariables(nested, cu, lineMap, sourcePositions, currentScope + "/BLOCK", symbols);
            } else if (st instanceof IfTree it) {
                if (it.getThenStatement() instanceof BlockTree tb) {
                    resolveBlockVariables(tb, cu, lineMap, sourcePositions, currentScope + "/IF", symbols);
                }
                if (it.getElseStatement() instanceof BlockTree eb) {
                    resolveBlockVariables(eb, cu, lineMap, sourcePositions, currentScope + "/ELSE", symbols);
                }
            } else if (st instanceof ForLoopTree flt && flt.getStatement() instanceof BlockTree fb) {
                resolveBlockVariables(fb, cu, lineMap, sourcePositions, currentScope + "/FOR", symbols);
            } else if (st instanceof WhileLoopTree wlt && wlt.getStatement() instanceof BlockTree wb) {
                resolveBlockVariables(wb, cu, lineMap, sourcePositions, currentScope + "/WHILE", symbols);
            }
        }
    }

    private int getLine(CompilationUnitTree cu, Tree tree, LineMap lineMap, SourcePositions sp) {
        if (lineMap == null || tree == null) return 1;
        long pos = sp.getStartPosition(cu, tree);
        return pos >= 0 ? (int) lineMap.getLineNumber(pos) : 1;
    }

    private int getCol(CompilationUnitTree cu, Tree tree, LineMap lineMap, SourcePositions sp) {
        if (lineMap == null || tree == null) return 1;
        long pos = sp.getStartPosition(cu, tree);
        return pos >= 0 ? (int) lineMap.getColumnNumber(pos) : 1;
    }
}
