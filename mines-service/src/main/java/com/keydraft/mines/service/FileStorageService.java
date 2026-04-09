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

    private final String baseUploadDir = "uploads";

    public FileStorageService() {
        File directory = new File(baseUploadDir);
        if (!directory.exists()) {
            directory.mkdirs();
        }
    }

    public String storeFile(MultipartFile file, String subDir) {
        if (file == null || file.isEmpty()) return null;
        try {
            Path uploadPath = Paths.get(baseUploadDir).resolve(subDir);
            if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

            String originalFileName = file.getOriginalFilename();
            String extension = (originalFileName != null && originalFileName.contains(".")) ? 
                originalFileName.substring(originalFileName.lastIndexOf(".")) : "";

            String storedFileName = UUID.randomUUID().toString() + extension;
            Path targetPath = uploadPath.resolve(storedFileName);
            Files.copy(file.getInputStream(), targetPath);
            return storedFileName;
        } catch (IOException e) {
            throw new RuntimeException("Could not store file", e);
        }
    }

    public Path getFilePath(String fileName, String subDir) {
        return Paths.get(baseUploadDir).resolve(subDir).resolve(fileName);
    }
}
