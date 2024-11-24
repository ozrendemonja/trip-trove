package com.triptrove.manager.application.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
public class Test {
    public record MyResponse(String message, int number){}

    @GetMapping("/test")
    @CrossOrigin(origins = "http://localhost:8085")
    public MyResponse test() {
        return new MyResponse("Hello World!", 1);
    }
}
