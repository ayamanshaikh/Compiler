package com.codevista.enterprise.controller;

import com.codevista.enterprise.dto.HibernateExecuteRequest;
import com.codevista.enterprise.dto.HibernateExecuteResponse;
import com.codevista.enterprise.dto.HibernateScenarioResponse;
import com.codevista.enterprise.dto.ServletExecuteRequest;
import com.codevista.enterprise.dto.ServletExecuteResponse;
import com.codevista.enterprise.dto.ServletScenarioResponse;
import com.codevista.enterprise.service.HibernateEducationalService;
import com.codevista.enterprise.service.ServletEducationalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/enterprise")
public class EnterpriseEducationalController {

    private final ServletEducationalService servletService;
    private final HibernateEducationalService hibernateService;

    public EnterpriseEducationalController(ServletEducationalService servletService,
                                           HibernateEducationalService hibernateService) {
        this.servletService = servletService;
        this.hibernateService = hibernateService;
    }

    // -------------------------------------------------------------
    // Servlet Sandbox Endpoints
    // -------------------------------------------------------------

    @GetMapping("/servlets/scenarios")
    public ResponseEntity<List<ServletScenarioResponse>> getServletScenarios() {
        return ResponseEntity.ok(servletService.getAllScenarios());
    }

    @GetMapping("/servlets/scenarios/{id}")
    public ResponseEntity<ServletScenarioResponse> getServletScenario(@PathVariable String id) {
        return ResponseEntity.ok(servletService.getScenario(id));
    }

    @PostMapping("/servlets/execute")
    public ResponseEntity<ServletExecuteResponse> executeServlet(@RequestBody ServletExecuteRequest request) {
        return ResponseEntity.ok(servletService.execute(request));
    }

    // -------------------------------------------------------------
    // Hibernate / ORM Workbench Endpoints
    // -------------------------------------------------------------

    @GetMapping("/hibernate/scenarios")
    public ResponseEntity<List<HibernateScenarioResponse>> getHibernateScenarios() {
        return ResponseEntity.ok(hibernateService.getAllScenarios());
    }

    @GetMapping("/hibernate/scenarios/{id}")
    public ResponseEntity<HibernateScenarioResponse> getHibernateScenario(@PathVariable String id) {
        return ResponseEntity.ok(hibernateService.getScenario(id));
    }

    @PostMapping("/hibernate/execute")
    public ResponseEntity<HibernateExecuteResponse> executeHibernate(@RequestBody HibernateExecuteRequest request) {
        return ResponseEntity.ok(hibernateService.execute(request));
    }
}
