package com.codevista.compiler.pipeline.service;

import com.codevista.compiler.pipeline.model.CompilerToken;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * High-fidelity lexical scanner for Java source code.
 * Deconstructs raw source characters into classified tokens with line and column bounds.
 */
@Service
public class JavaLexerService {

    private static final Set<String> KEYWORDS = Set.of(
            "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char", "class",
            "const", "continue", "default", "do", "double", "else", "enum", "extends", "final",
            "finally", "float", "for", "goto", "if", "implements", "import", "instanceof", "int",
            "interface", "long", "native", "new", "package", "private", "protected", "public",
            "return", "short", "static", "strictfp", "super", "switch", "synchronized", "this",
            "throw", "throws", "transient", "try", "void", "volatile", "while",
            "record", "sealed", "non-sealed", "permits", "yield", "var"
    );

    public List<CompilerToken> tokenize(String sourceCode) {
        List<CompilerToken> tokens = new ArrayList<>();
        if (sourceCode == null || sourceCode.isEmpty()) {
            return tokens;
        }

        int len = sourceCode.length();
        int i = 0;
        int line = 1;
        int col = 1;
        int tokenIndex = 0;

        while (i < len) {
            char c = sourceCode.charAt(i);

            // Handle newlines
            if (c == '\r') {
                i++;
                if (i < len && sourceCode.charAt(i) == '\n') {
                    i++;
                }
                line++;
                col = 1;
                continue;
            } else if (c == '\n') {
                i++;
                line++;
                col = 1;
                continue;
            }

            // Skip whitespace
            if (Character.isWhitespace(c)) {
                i++;
                col++;
                continue;
            }

            // Single-line comment
            if (c == '/' && i + 1 < len && sourceCode.charAt(i + 1) == '/') {
                int startCol = col;
                int start = i;
                while (i < len && sourceCode.charAt(i) != '\n' && sourceCode.charAt(i) != '\r') {
                    i++;
                    col++;
                }
                String val = sourceCode.substring(start, i);
                tokens.add(new CompilerToken(tokenIndex++, "COMMENT", val, line, startCol, col - 1, "COMMENT"));
                continue;
            }

            // Multi-line comment
            if (c == '/' && i + 1 < len && sourceCode.charAt(i + 1) == '*') {
                int startCol = col;
                int startLine = line;
                int start = i;
                i += 2;
                col += 2;
                while (i + 1 < len && !(sourceCode.charAt(i) == '*' && sourceCode.charAt(i + 1) == '/')) {
                    if (sourceCode.charAt(i) == '\n') {
                        line++;
                        col = 1;
                    } else {
                        col++;
                    }
                    i++;
                }
                if (i + 1 < len) {
                    i += 2;
                    col += 2;
                }
                String val = sourceCode.substring(start, Math.min(i, len));
                tokens.add(new CompilerToken(tokenIndex++, "COMMENT", val, startLine, startCol, col - 1, "COMMENT"));
                continue;
            }

            // String literal
            if (c == '"') {
                int startCol = col;
                int start = i;
                i++;
                col++;
                while (i < len && sourceCode.charAt(i) != '"') {
                    if (sourceCode.charAt(i) == '\\' && i + 1 < len) {
                        i += 2;
                        col += 2;
                    } else if (sourceCode.charAt(i) == '\n') {
                        line++;
                        col = 1;
                        i++;
                    } else {
                        i++;
                        col++;
                    }
                }
                if (i < len && sourceCode.charAt(i) == '"') {
                    i++;
                    col++;
                }
                String val = sourceCode.substring(start, Math.min(i, len));
                tokens.add(new CompilerToken(tokenIndex++, "STRING_LITERAL", val, line, startCol, col - 1, "LITERAL"));
                continue;
            }

            // Character literal
            if (c == '\'') {
                int startCol = col;
                int start = i;
                i++;
                col++;
                while (i < len && sourceCode.charAt(i) != '\'') {
                    if (sourceCode.charAt(i) == '\\' && i + 1 < len) {
                        i += 2;
                        col += 2;
                    } else {
                        i++;
                        col++;
                    }
                }
                if (i < len && sourceCode.charAt(i) == '\'') {
                    i++;
                    col++;
                }
                String val = sourceCode.substring(start, Math.min(i, len));
                tokens.add(new CompilerToken(tokenIndex++, "CHAR_LITERAL", val, line, startCol, col - 1, "LITERAL"));
                continue;
            }

            // Number literal
            if (Character.isDigit(c) || (c == '.' && i + 1 < len && Character.isDigit(sourceCode.charAt(i + 1)))) {
                int startCol = col;
                int start = i;
                boolean isHex = (c == '0' && i + 1 < len && (sourceCode.charAt(i + 1) == 'x' || sourceCode.charAt(i + 1) == 'X'));
                if (isHex) {
                    i += 2;
                    col += 2;
                    while (i < len && (Character.isDigit(sourceCode.charAt(i)) ||
                            (sourceCode.charAt(i) >= 'a' && sourceCode.charAt(i) <= 'f') ||
                            (sourceCode.charAt(i) >= 'A' && sourceCode.charAt(i) <= 'F') ||
                            sourceCode.charAt(i) == '_')) {
                        i++;
                        col++;
                    }
                } else {
                    while (i < len && (Character.isDigit(sourceCode.charAt(i)) || sourceCode.charAt(i) == '.' || sourceCode.charAt(i) == '_')) {
                        i++;
                        col++;
                    }
                }
                // Optional suffix: L, l, F, f, D, d
                if (i < len && "LlFfDd".indexOf(sourceCode.charAt(i)) >= 0) {
                    i++;
                    col++;
                }
                String val = sourceCode.substring(start, i);
                tokens.add(new CompilerToken(tokenIndex++, "NUMERIC_LITERAL", val, line, startCol, col - 1, "LITERAL"));
                continue;
            }

            // Identifiers and Keywords
            if (Character.isJavaIdentifierStart(c)) {
                int startCol = col;
                int start = i;
                while (i < len && Character.isJavaIdentifierPart(sourceCode.charAt(i))) {
                    i++;
                    col++;
                }
                String val = sourceCode.substring(start, i);

                if ("true".equals(val) || "false".equals(val)) {
                    tokens.add(new CompilerToken(tokenIndex++, "BOOLEAN_LITERAL", val, line, startCol, col - 1, "LITERAL"));
                } else if ("null".equals(val)) {
                    tokens.add(new CompilerToken(tokenIndex++, "NULL_LITERAL", val, line, startCol, col - 1, "LITERAL"));
                } else if (KEYWORDS.contains(val)) {
                    tokens.add(new CompilerToken(tokenIndex++, "KEYWORD", val, line, startCol, col - 1, "KEYWORD"));
                } else {
                    tokens.add(new CompilerToken(tokenIndex++, "IDENTIFIER", val, line, startCol, col - 1, "IDENTIFIER"));
                }
                continue;
            }

            // Multi-character and single-character operators
            String op3 = (i + 3 <= len) ? sourceCode.substring(i, i + 3) : "";
            if (">>>=".equals(op3) || ">>>".equals(op3)) {
                int opLen = ">>>=".equals(op3) ? 4 : 3;
                if (i + opLen <= len && ">>>=".equals(sourceCode.substring(i, i + opLen))) {
                    tokens.add(new CompilerToken(tokenIndex++, "OPERATOR", ">>>=", line, col, col + 3, "OPERATOR"));
                    i += 4;
                    col += 4;
                    continue;
                }
                tokens.add(new CompilerToken(tokenIndex++, "OPERATOR", ">>>", line, col, col + 2, "OPERATOR"));
                i += 3;
                col += 3;
                continue;
            }

            String op2 = (i + 2 <= len) ? sourceCode.substring(i, i + 2) : "";
            if (Set.of("==", "!=", "<=", ">=", "&&", "||", "++", "--", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "<<=", ">>=", "->", "::").contains(op2)) {
                tokens.add(new CompilerToken(tokenIndex++, "OPERATOR", op2, line, col, col + 1, "OPERATOR"));
                i += 2;
                col += 2;
                continue;
            }

            if ("+-*/%=<>!&|^~?:".indexOf(c) >= 0) {
                tokens.add(new CompilerToken(tokenIndex++, "OPERATOR", String.valueOf(c), line, col, col, "OPERATOR"));
                i++;
                col++;
                continue;
            }

            // Separators
            if ("(){}[];,.@".indexOf(c) >= 0) {
                tokens.add(new CompilerToken(tokenIndex++, "SEPARATOR", String.valueOf(c), line, col, col, "SEPARATOR"));
                i++;
                col++;
                continue;
            }

            // Other unknown character
            tokens.add(new CompilerToken(tokenIndex++, "UNKNOWN", String.valueOf(c), line, col, col, "UNKNOWN"));
            i++;
            col++;
        }

        return tokens;
    }
}
