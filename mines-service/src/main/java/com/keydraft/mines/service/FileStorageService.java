package com.keydraft.mines.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageService {

    private final String uploadDir = "uploads/employees";

    public FileStorageService() {
        File directory = new File(uploadDir);
        if (!directory.exists()) {
            boolean created = directory.mkdirs();
            if (!created) {
                System.err.println("Fatal: Could not create upload directory " + uploadDir);
            }
        }
    }

    /**
     * Stores a file locally and returns the stored filename.
     */
    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty())
            return null;

        try {
            String originalFileName = file.getOriginalFilename();
            String extension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                extension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }

            String storedFileName = UUID.randomUUID().toString() + extension;
            Path targetPath = Paths.get(uploadDir).resolve(storedFileName);
            Files.copy(file.getInputStream(), targetPath);

            return storedFileName;
        } catch (IOException e) {
            throw new RuntimeException("Could not store file", e);
        }
    }

    /**
     * Returns the physical path for a stored filename.
     */
    public Path getFilePath(String fileName) {
        return Paths.get(uploadDir).resolve(fileName);
    }
}
