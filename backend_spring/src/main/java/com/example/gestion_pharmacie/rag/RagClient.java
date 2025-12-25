package com.example.gestion_pharmacie.rag;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class RagClient {
    private static final Logger log = LoggerFactory.getLogger(RagClient.class);

    private final RestTemplate restTemplate;
    private final RagProperties props;

    public RagClient(RagProperties props) {
        this.props = props;
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(5000);
        f.setReadTimeout(25000);
        this.restTemplate = new RestTemplate(f);
    }

    public RagResponse chatWithRag(String prompt, List<String> context, Integer maxNewTokens, Double temperature, Double topP) {
        String url = props.getBaseUrl() + "/chat";

        // Limit and sanitize context
        List<String> safeContext = Optional.ofNullable(context).orElse(Collections.emptyList()).stream()
                .map(this::truncateItem)
                .filter(s -> s != null && !s.isBlank())
                .limit(props.getContextMaxItems())
                .collect(Collectors.toList());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("prompt", prompt);
        body.put("max_new_tokens", maxNewTokens != null ? maxNewTokens : 300);
        body.put("temperature", temperature != null ? temperature : 0.7);
        body.put("top_p", topP != null ? topP : 0.9);
        body.put("use_rag", true);  // Always enable S3 retrieval to combine with external_context
        if (!safeContext.isEmpty()) {
            body.put("external_context", safeContext);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (props.getServiceToken() != null && !props.getServiceToken().isBlank()) {
            headers.set("X-Service-Auth", props.getServiceToken());
        }

        // Safe log (truncate long fields)
        log.info("[RAG] Sending prompt='{}' ctxItems={} url={}", truncateForLog(prompt, 160), safeContext.size(), url);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<RagResponse> response = restTemplate.exchange(url, HttpMethod.POST, entity, RagResponse.class);
            return response.getBody();
        } catch (RestClientException ex) {
            log.error("[RAG] Error calling RAG service: {}", ex.getMessage(), ex);
            throw ex;
        }
    }

    private String truncateItem(String s) {
        if (s == null) return null;
        if (s.length() <= props.getContextMaxCharsPerItem()) return s.trim();
        return s.substring(0, props.getContextMaxCharsPerItem()).trim();
    }

    private String truncateForLog(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }
}
