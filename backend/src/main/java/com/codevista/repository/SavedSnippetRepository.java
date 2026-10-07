package com.codevista.repository;

import com.codevista.entity.SavedSnippet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SavedSnippetRepository extends JpaRepository<SavedSnippet, Long> {

    List<SavedSnippet> findByUserIdOrderByUpdatedAtDesc(Long userId);
}
