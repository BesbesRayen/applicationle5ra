package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.CashbackDto;
import com.creaditn.creaditnbackend.dto.CashbackHistoryDto;
import com.creaditn.creaditnbackend.dto.CashbackOfferDto;
import com.creaditn.creaditnbackend.entity.Merchant;
import com.creaditn.creaditnbackend.entity.Payment;
import com.creaditn.creaditnbackend.repository.MerchantRepository;
import com.creaditn.creaditnbackend.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
public class RewardsService {

    private static final BigDecimal CASHBACK_RATE = new BigDecimal("0.02"); // 2% of payment amount

    private final PaymentRepository paymentRepository;
    private final MerchantRepository merchantRepository;

    public CashbackDto getCashback(Long userId) {
        List<Payment> payments = paymentRepository.findByUserId(userId);
        List<CashbackHistoryDto> history = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        AtomicLong id = new AtomicLong(1);
        for (Payment p : payments) {
            BigDecimal cb = p.getAmount().multiply(CASHBACK_RATE).setScale(2, RoundingMode.HALF_UP);
            if (cb.compareTo(BigDecimal.ZERO) <= 0) continue;
            total = total.add(cb);
            history.add(CashbackHistoryDto.builder()
                    .id(id.getAndIncrement())
                    .amount(cb)
                    .source("Paiement " + p.getTransactionReference())
                    .date(p.getPaidAt() != null
                            ? p.getPaidAt().toLocalDate().toString()
                            : LocalDate.now().toString())
                    .build());
        }
        return CashbackDto.builder()
                .available(total)
                .history(history)
                .build();
    }

    public List<CashbackOfferDto> getOffers(Long userId) {
        List<Merchant> merchants = merchantRepository.findByActiveTrue();
        List<CashbackOfferDto> out = new ArrayList<>();
        long id = 1;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        LocalDate exp = LocalDate.now().plusMonths(1);
        for (Merchant m : merchants) {
            BigDecimal pct = BigDecimal.valueOf(2 + (id % 4)); // 2% - 5%
            out.add(CashbackOfferDto.builder()
                    .id(id++)
                    .merchantId(m.getId())
                    .merchantName(m.getName())
                    .percentage(pct)
                    .expiryDate(exp.plusDays(id).format(fmt))
                    .build());
        }
        if (out.isEmpty()) {
            out.add(CashbackOfferDto.builder()
                    .id(1L)
                    .merchantId(0L)
                    .merchantName("Creadi.tn")
                    .percentage(BigDecimal.valueOf(3))
                    .expiryDate(exp.format(fmt))
                    .build());
        }
        return out;
    }

    public List<CashbackHistoryDto> getHistory(Long userId) {
        return getCashback(userId).getHistory();
    }
}
