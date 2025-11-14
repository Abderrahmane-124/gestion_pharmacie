package com.example.gestion_pharmacie.rag;

public class ChatRequestDto {
    private String message;
    private Integer max_new_tokens;
    private Double temperature;
    private Double top_p;

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Integer getMax_new_tokens() { return max_new_tokens; }
    public void setMax_new_tokens(Integer max_new_tokens) { this.max_new_tokens = max_new_tokens; }
    public Double getTemperature() { return temperature; }
    public void setTemperature(Double temperature) { this.temperature = temperature; }
    public Double getTop_p() { return top_p; }
    public void setTop_p(Double top_p) { this.top_p = top_p; }
}

