package com.creaditn.creaditnbackend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploadPath = uploadDir;
        // Convert to absolute path if relative
        if (!Paths.get(uploadDir).isAbsolute()) {
            uploadPath = System.getProperty("user.dir") + File.separator + uploadDir;
        }
        registry.addResourceHandler("/api/files/**")
                .addResourceLocations("file:" + uploadPath + "/");
    }
}
