package com.codevista.compiler.intelligence;

import com.codevista.compiler.intelligence.explainer.*;
import com.codevista.compiler.intelligence.model.ErrorExplanation;
import com.codevista.compiler.model.CompilerDiagnostic;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class DiagnosticExplainerUnitTest {

    @Test
    @DisplayName("1. SemicolonExpectedExplainer explains missing semicolon")
    void testSemicolonExpectedExplainer() {
        SemicolonExpectedExplainer explainer = new SemicolonExpectedExplainer();
        CompilerDiagnostic diagnostic = new CompilerDiagnostic(
                5, 12, "';' expected", "int x = 10", "ERROR", "compiler.err.expected"
        );

        assertThat(explainer.supports(diagnostic)).isTrue();
        ErrorExplanation explanation = explainer.explain(diagnostic);

        assertThat(explanation.getTechnicalError()).isEqualTo("';' expected");
        assertThat(explanation.getSimpleExplanation()).contains("semicolon (;)");
        assertThat(explanation.getWhyItHappened()).contains("must end with a semicolon");
        assertThat(explanation.getHowToFix()).contains("Add a semicolon");
        assertThat(explanation.getAffectedLine()).isEqualTo(5);
        assertThat(explanation.getRelevantSource()).isEqualTo("int x = 10");
        assertThat(explanation.getSuggestion()).isEqualTo("int x = 10;");
    }

    @Test
    @DisplayName("2. CannotFindSymbolExplainer explains missing variable, method, and class")
    void testCannotFindSymbolExplainer() {
        CannotFindSymbolExplainer explainer = new CannotFindSymbolExplainer();

        // Variable
        CompilerDiagnostic varDiag = new CompilerDiagnostic(
                3, 9, "cannot find symbol\n  symbol:   variable count\n  location: class Main",
                "count++", "ERROR", "compiler.err.cant.resolve.location"
        );
        assertThat(explainer.supports(varDiag)).isTrue();
        ErrorExplanation varExp = explainer.explain(varDiag);
        assertThat(varExp.getSimpleExplanation()).contains("variable 'count'");
        assertThat(varExp.getHowToFix()).contains("Declare the variable");

        // Method
        CompilerDiagnostic methodDiag = new CompilerDiagnostic(
                4, 9, "cannot find symbol\n  symbol:   method calculateTotal()\n  location: class Main",
                "calculateTotal()", "ERROR", "compiler.err.cant.resolve.location"
        );
        ErrorExplanation methodExp = explainer.explain(methodDiag);
        assertThat(methodExp.getSimpleExplanation()).contains("method 'calculateTotal'");
        assertThat(methodExp.getWhyItHappened()).contains("is either misspelled, not defined");

        // Class
        CompilerDiagnostic classDiag = new CompilerDiagnostic(
                2, 5, "cannot find symbol\n  symbol:   class Scanner\n  location: class Main",
                "Scanner sc = null;", "ERROR", "compiler.err.cant.resolve"
        );
        ErrorExplanation classExp = explainer.explain(classDiag);
        assertThat(classExp.getSimpleExplanation()).contains("class 'Scanner'");
        assertThat(classExp.getSuggestion()).contains("import java.util.Scanner;");
    }

    @Test
    @DisplayName("3. ReachedEofExplainer explains unclosed braces at end of file")
    void testReachedEofExplainer() {
        ReachedEofExplainer explainer = new ReachedEofExplainer();
        CompilerDiagnostic diagnostic = new CompilerDiagnostic(
                10, 1, "reached end of file while parsing", "}", "ERROR", "compiler.err.premature.eof"
        );

        assertThat(explainer.supports(diagnostic)).isTrue();
        ErrorExplanation exp = explainer.explain(diagnostic);
        assertThat(exp.getSimpleExplanation()).contains("reached the end of the file unexpectedly");
        assertThat(exp.getWhyItHappened()).contains("opening curly braces '{'");
        assertThat(exp.getHowToFix()).contains("verify every opening brace");
    }

    @Test
    @DisplayName("4. TypeExpectedExplainer explains code outside class declaration")
    void testTypeExpectedExplainer() {
        TypeExpectedExplainer explainer = new TypeExpectedExplainer();
        CompilerDiagnostic diagnostic = new CompilerDiagnostic(
                1, 1, "class, interface, enum, or record expected", "System.out.println(1);", "ERROR", "compiler.err.expected"
        );

        assertThat(explainer.supports(diagnostic)).isTrue();
        ErrorExplanation exp = explainer.explain(diagnostic);
        assertThat(exp.getSimpleExplanation()).contains("expected a class, interface, enum, or record declaration");
        assertThat(exp.getHowToFix()).contains("Enclose the statement or method inside a class body");
    }

    @Test
    @DisplayName("5. IllegalStartOfExpressionExplainer explains invalid expression tokens")
    void testIllegalStartOfExpressionExplainer() {
        IllegalStartOfExpressionExplainer explainer = new IllegalStartOfExpressionExplainer();
        CompilerDiagnostic diagnostic = new CompilerDiagnostic(
                6, 5, "illegal start of expression", "public void inner() {}", "ERROR", "compiler.err.illegal.start.of.expr"
        );

        assertThat(explainer.supports(diagnostic)).isTrue();
        ErrorExplanation exp = explainer.explain(diagnostic);
        assertThat(exp.getSimpleExplanation()).contains("cannot legally start an expression");
        assertThat(exp.getWhyItHappened()).contains("nesting a method inside another method");
    }

    @Test
    @DisplayName("6. IncompatibleTypesExplainer explains mismatched type assignment")
    void testIncompatibleTypesExplainer() {
        IncompatibleTypesExplainer explainer = new IncompatibleTypesExplainer();
        CompilerDiagnostic diagnostic = new CompilerDiagnostic(
                4, 15, "incompatible types: java.lang.String cannot be converted to int",
                "int a = \"hello\";", "ERROR", "compiler.err.prob.found.req"
        );

        assertThat(explainer.supports(diagnostic)).isTrue();
        ErrorExplanation exp = explainer.explain(diagnostic);
        assertThat(exp.getSimpleExplanation()).contains("Cannot assign a value of type 'java.lang.String' to a variable of type 'int'");
        assertThat(exp.getWhyItHappened()).contains("Java is strongly typed");
        assertThat(exp.getHowToFix()).contains("Match the variable type");
    }

    @Test
    @DisplayName("7. VariableNotInitializedExplainer explains uninitialized local variables")
    void testVariableNotInitializedExplainer() {
        VariableNotInitializedExplainer explainer = new VariableNotInitializedExplainer();
        CompilerDiagnostic diagnostic = new CompilerDiagnostic(
                7, 20, "variable total might not have been initialized",
                "System.out.println(total);", "ERROR", "compiler.err.var.might.not.have.been.initialized"
        );

        assertThat(explainer.supports(diagnostic)).isTrue();
        ErrorExplanation exp = explainer.explain(diagnostic);
        assertThat(exp.getSimpleExplanation()).contains("variable 'total' is read before it was guaranteed to have a value");
        assertThat(exp.getWhyItHappened()).contains("Local variables declared inside methods do not have default values");
        assertThat(exp.getSuggestion()).contains("Initialize 'total'");
    }

    @Test
    @DisplayName("8. StaticContextExplainer explains referencing non-static member from static method")
    void testStaticContextExplainer() {
        StaticContextExplainer explainer = new StaticContextExplainer();
        CompilerDiagnostic diagnostic = new CompilerDiagnostic(
                5, 9, "non-static variable score cannot be referenced from a static context",
                "System.out.println(score);", "ERROR", "compiler.err.non-static.cant.be.ref"
        );

        assertThat(explainer.supports(diagnostic)).isTrue();
        ErrorExplanation exp = explainer.explain(diagnostic);
        assertThat(exp.getSimpleExplanation()).contains("non-static variable 'score'");
        assertThat(exp.getWhyItHappened()).contains("Static methods belong to the class itself");
        assertThat(exp.getHowToFix()).contains("declare the variable as 'static'");
    }

    @Test
    @DisplayName("9. InvalidMethodArgumentsExplainer explains argument count and type mismatches")
    void testInvalidMethodArgumentsExplainer() {
        InvalidMethodArgumentsExplainer explainer = new InvalidMethodArgumentsExplainer();
        CompilerDiagnostic diagnostic = new CompilerDiagnostic(
                8, 9, "method printNumber in class Main cannot be applied to given types; required: int; found: java.lang.String",
                "printNumber(\"abc\");", "ERROR", "compiler.err.cant.apply.symbol"
        );

        assertThat(explainer.supports(diagnostic)).isTrue();
        ErrorExplanation exp = explainer.explain(diagnostic);
        assertThat(exp.getSimpleExplanation()).contains("arguments passed to the method do not match");
        assertThat(exp.getWhyItHappened()).contains("expects different argument types");
    }

    @Test
    @DisplayName("10. InvalidConstructorArgumentsExplainer explains mismatched constructor arguments")
    void testInvalidConstructorArgumentsExplainer() {
        InvalidConstructorArgumentsExplainer explainer = new InvalidConstructorArgumentsExplainer();
        CompilerDiagnostic diagnostic = new CompilerDiagnostic(
                6, 17, "constructor Person in class Person cannot be applied to given types; required: java.lang.String; found: no arguments",
                "new Person()", "ERROR", "compiler.err.cant.apply.symbol"
        );

        assertThat(explainer.supports(diagnostic)).isTrue();
        ErrorExplanation exp = explainer.explain(diagnostic);
        assertThat(exp.getSimpleExplanation()).contains("constructor arguments passed to 'new' do not match");
        assertThat(exp.getWhyItHappened()).contains("removes the default no-argument constructor");
    }

    @Test
    @DisplayName("11. DuplicateClassExplainer explains duplicate class declarations")
    void testDuplicateClassExplainer() {
        DuplicateClassExplainer explainer = new DuplicateClassExplainer();
        CompilerDiagnostic diagnostic = new CompilerDiagnostic(
                12, 7, "duplicate class: com.codevista.User",
                "class User {}", "ERROR", "compiler.err.duplicate.class"
        );

        assertThat(explainer.supports(diagnostic)).isTrue();
        ErrorExplanation exp = explainer.explain(diagnostic);
        assertThat(exp.getSimpleExplanation()).contains("class 'com.codevista.User' is already defined");
        assertThat(exp.getWhyItHappened()).contains("Java does not allow two classes with the exact same name");
    }

    @Test
    @DisplayName("12. PackageDoesNotExistExplainer explains invalid import package")
    void testPackageDoesNotExistExplainer() {
        PackageDoesNotExistExplainer explainer = new PackageDoesNotExistExplainer();
        CompilerDiagnostic diagnostic = new CompilerDiagnostic(
                1, 15, "package org.unknown.package does not exist",
                "import org.unknown.package.Tool;", "ERROR", "compiler.err.pkg.doesnt.exist"
        );

        assertThat(explainer.supports(diagnostic)).isTrue();
        ErrorExplanation exp = explainer.explain(diagnostic);
        assertThat(exp.getSimpleExplanation()).contains("package 'org.unknown.package'");
        assertThat(exp.getWhyItHappened()).contains("misspelled, or references a third-party library");
    }

    @Test
    @DisplayName("13. MissingReturnExplainer explains missing return statement in non-void method")
    void testMissingReturnExplainer() {
        MissingReturnExplainer explainer = new MissingReturnExplainer();
        CompilerDiagnostic diagnostic = new CompilerDiagnostic(
                8, 5, "missing return statement",
                "public int getAge() {}", "ERROR", "compiler.err.missing.ret.stmt"
        );

        assertThat(explainer.supports(diagnostic)).isTrue();
        ErrorExplanation exp = explainer.explain(diagnostic);
        assertThat(exp.getSimpleExplanation()).contains("missing a 'return' statement");
        assertThat(exp.getWhyItHappened()).contains("Non-void methods in Java must guarantee that a value");
    }

    @Test
    @DisplayName("14. UnreportedExceptionExplainer explains uncaught checked exceptions")
    void testUnreportedExceptionExplainer() {
        UnreportedExceptionExplainer explainer = new UnreportedExceptionExplainer();
        CompilerDiagnostic diagnostic = new CompilerDiagnostic(
                6, 13, "unreported exception java.io.IOException; must be caught or declared to be thrown",
                "new FileReader(\"test.txt\");", "ERROR", "compiler.err.unreported.exception.need.to.catch.or.throw"
        );

        assertThat(explainer.supports(diagnostic)).isTrue();
        ErrorExplanation exp = explainer.explain(diagnostic);
        assertThat(exp.getSimpleExplanation()).contains("checked exception ('java.io.IOException')");
        assertThat(exp.getWhyItHappened()).contains("checked exception handling at compile time");
    }

    @Test
    @DisplayName("15. ExceptionAlreadyCaughtExplainer explains shadowed catch blocks")
    void testExceptionAlreadyCaughtExplainer() {
        ExceptionAlreadyCaughtExplainer explainer = new ExceptionAlreadyCaughtExplainer();
        CompilerDiagnostic diagnostic = new CompilerDiagnostic(
                11, 11, "exception java.io.FileNotFoundException has already been caught",
                "} catch (FileNotFoundException e) {", "ERROR", "compiler.err.already.caught"
        );

        assertThat(explainer.supports(diagnostic)).isTrue();
        ErrorExplanation exp = explainer.explain(diagnostic);
        assertThat(exp.getSimpleExplanation()).contains("'java.io.FileNotFoundException' is already caught");
        assertThat(exp.getWhyItHappened()).contains("evaluated from top to bottom");
    }

    @Test
    @DisplayName("16. UnreachableStatementExplainer explains code after return/break")
    void testUnreachableStatementExplainer() {
        UnreachableStatementExplainer explainer = new UnreachableStatementExplainer();
        CompilerDiagnostic diagnostic = new CompilerDiagnostic(
                9, 9, "unreachable statement",
                "System.out.println(\"done\");", "ERROR", "compiler.err.unreachable.stmt"
        );

        assertThat(explainer.supports(diagnostic)).isTrue();
        ErrorExplanation exp = explainer.explain(diagnostic);
        assertThat(exp.getSimpleExplanation()).contains("never be reached or executed");
        assertThat(exp.getWhyItHappened()).contains("after a control-flow jump");
    }

    @Test
    @DisplayName("17. InvalidReturnTypeExplainer explains returning value from void method or missing return type")
    void testInvalidReturnTypeExplainer() {
        InvalidReturnTypeExplainer explainer = new InvalidReturnTypeExplainer();

        CompilerDiagnostic voidDiag = new CompilerDiagnostic(
                5, 16, "cannot return a value from a method with void result type",
                "return 42;", "ERROR", "compiler.err.cant.ret.val.from.void.meth"
        );
        assertThat(explainer.supports(voidDiag)).isTrue();
        ErrorExplanation voidExp = explainer.explain(voidDiag);
        assertThat(voidExp.getSimpleExplanation()).contains("declared with a 'void' return type");

        CompilerDiagnostic missingTypeDiag = new CompilerDiagnostic(
                3, 5, "missing return type or return type required",
                "public doWork() {}", "ERROR", "compiler.err.return.type.required"
        );
        assertThat(explainer.supports(missingTypeDiag)).isTrue();
        ErrorExplanation missingExp = explainer.explain(missingTypeDiag);
        assertThat(missingExp.getSimpleExplanation()).contains("missing a return type");
    }

    @Test
    @DisplayName("18. AccessModifierExplainer explains private and protected access violations")
    void testAccessModifierExplainer() {
        AccessModifierExplainer explainer = new AccessModifierExplainer();

        CompilerDiagnostic privateDiag = new CompilerDiagnostic(
                6, 12, "secretKey has private access in com.codevista.Vault",
                "vault.secretKey", "ERROR", "compiler.err.report.access"
        );
        assertThat(explainer.supports(privateDiag)).isTrue();
        ErrorExplanation privExp = explainer.explain(privateDiag);
        assertThat(privExp.getSimpleExplanation()).contains("access a 'private' member");
        assertThat(privExp.getWhyItHappened()).contains("marked 'private' are encapsulated");

        CompilerDiagnostic protectedDiag = new CompilerDiagnostic(
                7, 12, "helperMethod() has protected access in com.codevista.Base",
                "base.helperMethod()", "ERROR", "compiler.err.report.access"
        );
        assertThat(explainer.supports(protectedDiag)).isTrue();
        ErrorExplanation protExp = explainer.explain(protectedDiag);
        assertThat(protExp.getSimpleExplanation()).contains("access a 'protected' member");
    }

    @Test
    @DisplayName("19. DefaultFallbackExplainer provides helpful fallback for generic diagnostics")
    void testDefaultFallbackExplainer() {
        DefaultFallbackExplainer fallback = new DefaultFallbackExplainer();
        CompilerDiagnostic diagnostic = new CompilerDiagnostic(
                15, 4, "unexpected token", "???", "ERROR", "compiler.err.unknown"
        );

        assertThat(fallback.supports(diagnostic)).isTrue();
        ErrorExplanation exp = fallback.explain(diagnostic);
        assertThat(exp.getTechnicalError()).isEqualTo("unexpected token");
        assertThat(exp.getSimpleExplanation()).contains("line 15");
        assertThat(exp.getHowToFix()).contains("Inspect line 15");
    }
}
