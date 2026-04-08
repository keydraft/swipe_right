package com.keydraft.mines.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class SalesOrderRequest {
    private String transactionType;
    private UUID customerId;
    private String customerCode;
    private String guestCustomerName;
    private String vehicleNumber;
    private UUID productId;
    private Double rate;
    private Double grossWeight;
    private Double tareWeight;
    private Double netWeight;
    private Double amount;
    private Double discount;
    private Double roundOff;
    private Double payableAmount;
    private String billIncharge;
    private Double cashReceived;
    private Double upiReceived;
    private String upiId;
}
