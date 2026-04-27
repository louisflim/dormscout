package com.dormscout.backend.service;

import com.dormscout.backend.entity.Listing;
import com.dormscout.backend.entity.User;
import com.dormscout.backend.repository.ListingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.List;

@Service
public class ListingService {
    @Autowired
    private ListingRepository listingRepository;

    public Listing createListing(Listing listing, User landlord) {
        listing.setLandlord(landlord);
        if (listing.getStatus() == null) {
            listing.setStatus("Active");
        }
        return listingRepository.save(listing);
    }

    public List<Listing> getListingsByLandlord(User landlord) {
        return listingRepository.findByLandlord(landlord);
    }

    public List<Listing> getAllListings() {
        return listingRepository.findAll();
    }

    public List<Listing> getActiveListings() {
        return listingRepository.findByStatus("Active");
    }

    public Optional<Listing> getListingById(Long id) {
        return listingRepository.findById(id);
    }

    public Listing updateListing(Long id, Listing updates) {
        Optional<Listing> listingOpt = listingRepository.findById(id);

        if (listingOpt.isPresent()) {
            Listing listing = listingOpt.get();

            if (updates.getTitle() != null) {
                listing.setTitle(updates.getTitle());
            }
            if (updates.getAddress() != null) {
                listing.setAddress(updates.getAddress());
            }
            if (updates.getLatitude() != null) {
                listing.setLatitude(updates.getLatitude());
            }
            if (updates.getLongitude() != null) {
                listing.setLongitude(updates.getLongitude());
            }
            if (updates.getPrice() != null) {
                listing.setPrice(updates.getPrice());
            }
            if (updates.getTotalRooms() != null) {
                listing.setTotalRooms(updates.getTotalRooms());
            }
            if (updates.getAvailableRooms() != null) {
                listing.setAvailableRooms(updates.getAvailableRooms());
            }
            if (updates.getDescription() != null) {
                listing.setDescription(updates.getDescription());
            }
            if (updates.getUniversity() != null) {
                listing.setUniversity(updates.getUniversity());
            }
            if (updates.getGenderPolicy() != null) {
                listing.setGenderPolicy(updates.getGenderPolicy());
            }
            if (updates.getTags() != null) {
                listing.setTags(updates.getTags());
            }
            if (updates.getImages() != null) {
                listing.setImages(updates.getImages());
            }
            if (updates.getStatus() != null) {
                listing.setStatus(updates.getStatus());
            }

            return listingRepository.save(listing);
        }

        throw new RuntimeException("Listing not found");
    }

    public void deleteListing(Long id) {
        listingRepository.deleteById(id);
    }
}
