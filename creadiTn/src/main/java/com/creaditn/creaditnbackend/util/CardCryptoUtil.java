package com.creaditn.creaditnbackend.util;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

public final class CardCryptoUtil {
    private static final String AES = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int IV_LENGTH = 12;
    private static final int TAG_LENGTH = 128;

    private CardCryptoUtil() {
    }

    private static SecretKeySpec keySpec() {
        String rawKey = System.getenv().getOrDefault("APP_CARD_ENCRYPTION_KEY", "creaditn-dev-key-change-me");
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = digest.digest(rawKey.getBytes(StandardCharsets.UTF_8));
            return new SecretKeySpec(keyBytes, AES);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to build encryption key", e);
        }
    }

    public static String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isBlank()) {
            throw new IllegalArgumentException("Card number cannot be empty");
        }

        try {
            byte[] iv = new byte[IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec(), new GCMParameterSpec(TAG_LENGTH, iv));
            byte[] encrypted = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            ByteBuffer buffer = ByteBuffer.allocate(iv.length + encrypted.length);
            buffer.put(iv);
            buffer.put(encrypted);
            return Base64.getEncoder().encodeToString(buffer.array());
        } catch (Exception e) {
            throw new IllegalStateException("Unable to encrypt card number", e);
        }
    }

    public static String decrypt(String encryptedPayload) {
        if (encryptedPayload == null || encryptedPayload.isBlank()) {
            throw new IllegalArgumentException("Encrypted card number cannot be empty");
        }

        try {
            byte[] payload = Base64.getDecoder().decode(encryptedPayload);
            ByteBuffer buffer = ByteBuffer.wrap(payload);

            byte[] iv = new byte[IV_LENGTH];
            buffer.get(iv);
            byte[] encrypted = new byte[buffer.remaining()];
            buffer.get(encrypted);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, keySpec(), new GCMParameterSpec(TAG_LENGTH, iv));
            byte[] decrypted = cipher.doFinal(encrypted);
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to decrypt card number", e);
        }
    }

    public static String maskCardNumber(String cardNumber) {
        if (cardNumber == null) {
            return "**** **** **** ****";
        }
        String digitsOnly = cardNumber.replaceAll("\\D", "");
        String last4 = digitsOnly.length() <= 4
                ? digitsOnly
                : digitsOnly.substring(digitsOnly.length() - 4);
        return "**** **** **** " + last4;
    }
}
