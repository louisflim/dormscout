package com.dormscout.backend.service;

import com.dormscout.backend.entity.Bookmark;
import com.dormscout.backend.entity.User;
import com.dormscout.backend.entity.Listing;
import com.dormscout.backend.repository.BookmarkRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
public class BookmarkService {
    @Autowired
    private BookmarkRepository bookmarkRepository;

    public Bookmark saveBookmark(Bookmark bookmark) {
        Optional<Bookmark> existing = bookmarkRepository
            .findByTenantAndListing(bookmark.getTenant(), bookmark.getListing());
        if (existing.isPresent()) {
            throw new RuntimeException("Already bookmarked");
        }
        return bookmarkRepository.save(bookmark);
    }

    public List<Bookmark> getBookmarksByTenant(User tenant) {
        return bookmarkRepository.findByTenant(tenant);
    }

    public List<Bookmark> getAllBookmarks() {
        return bookmarkRepository.findAll();
    }

    @Transactional
    public void removeBookmark(User tenant, Listing listing) {
        bookmarkRepository.deleteByTenantAndListing(tenant, listing);
    }

    public void deleteBookmarkById(Long id) {
        bookmarkRepository.deleteById(id);
    }
}