package com.keydraft.mines.entity.enums;

public enum DcStatus {
    TARE_DONE,    // Initial weighment done, truck not loaded yet
    COMPLETED,    // Gross weight entered, payment done (POS) or ready for invoice (Credit)
    UNPAID,       // POS Pay Later — DC generated but payment pending
    INVOICED      // Credit — DC has been compiled into an invoice
}
