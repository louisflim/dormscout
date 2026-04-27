package com.dormscout.backend.controller;

<<<<<<< Updated upstream
=======
import com.dormscout.backend.entity.Review;
import com.dormscout.backend.entity.Listing;
import com.dormscout.backend.entity.User;
import com.dormscout.backend.service.ReviewService;
import com.dormscout.backend.service.ListingService;
import com.dormscout.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:3002"})
>>>>>>> Stashed changes
public class ReviewController {

}
