{
  "name": "Aayumarg Website Chat",
  "nodes": [
    {
      "name": "Website Chat Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2.2,
      "position": [0, 16],
      "parameters": {
        "httpMethod": "POST",
        "path": "aayumarg-chat",
        "authentication": "none",
        "responseMode": "responseNode",
        "options": {
          "allowedOrigins": "https://www.aayumarg.com,https://aayumarg.com"
        }
      }
    },
    {
      "name": "Validate Request",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [224, 16],
      "parameters": {
        "mode": "runOnceForAllItems",
        "language": "javaScript",
        "jsCode": "const ALLOWED = ['https://www.aayumarg.com', 'https://aayumarg.com'];\nconst MAX_MESSAGE = 2000;\nconst MAX_SESSION = 100;\nconst IP_LIMIT = 20;\nconst IP_WINDOW_MS = 10 * 60 * 1000;\nconst GLOBAL_LIMIT = 500;\nconst GLOBAL_WINDOW_MS = 60 * 60 * 1000;\n\nconst req = $input.first().json || {};\nconst headers = req.headers || {};\nconst body = req.body;\nconst origin = typeof headers.origin === 'string' ? headers.origin : '';\nconst originOk = !origin || ALLOWED.includes(origin);\nconst corsOrigin = origin && originOk ? origin : ALLOWED[0];\n\nfunction fail(status, error) {\n  return [{ json: { valid: false, status, error, corsOrigin } }];\n}\n\nif (!originOk) return fail(403, 'Origin not allowed.');\n\nif (!body || typeof body !== 'object' || Array.isArray(body)) {\n  return fail(400, 'Invalid request: body must be a JSON object with message and sessionId.');\n}\nif (typeof body.message !== 'string' || body.message.trim().length === 0) {\n  return fail(400, 'Invalid request: message must be a non-empty string.');\n}\nif (body.message.length > MAX_MESSAGE) {\n  return fail(400, 'Invalid request: message must be at most ' + MAX_MESSAGE + ' characters.');\n}\nif (typeof body.sessionId !== 'string' || body.sessionId.trim().length === 0 || body.sessionId.length > MAX_SESSION) {\n  return fail(400, 'Invalid request: sessionId must be a string of 1 to ' + MAX_SESSION + ' characters.');\n}\n\n// Best-effort rate limiting (kept in workflow static data; applies to published runs only)\nconst now = Date.now();\nconst store = $getWorkflowStaticData('global');\nstore.rl = store.rl || { ips: {}, all: [] };\nconst rl = store.rl;\nrl.all = rl.all.filter((t) => now - t < GLOBAL_WINDOW_MS);\nfor (const k of Object.keys(rl.ips)) {\n  rl.ips[k] = rl.ips[k].filter((t) => now - t < IP_WINDOW_MS);\n  if (rl.ips[k].length === 0) delete rl.ips[k];\n}\nconst ip = String(headers['cf-connecting-ip'] || headers['x-real-ip'] || String(headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown').slice(0, 64);\nconst ipHits = rl.ips[ip] || [];\nif (ipHits.length >= IP_LIMIT || rl.all.length >= GLOBAL_LIMIT) {\n  return fail(429, 'Too many requests. Please wait a few minutes and try again.');\n}\nipHits.push(now);\nrl.ips[ip] = ipHits;\nrl.all.push(now);\n\nreturn [{ json: { valid: true, message: body.message.trim(), sessionId: body.sessionId.trim(), corsOrigin } }];"
      }
    },
    {
      "name": "Is Request Valid",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [448, 128],
      "parameters": {
        "conditions": {
          "options": { "caseSensitive": true, "leftValue": "", "typeValidation": "strict", "version": 2 },
          "conditions": [
            {
              "id": "valid-flag",
              "leftValue": "={{ $json.valid }}",
              "rightValue": "",
              "operator": { "type": "boolean", "operation": "true", "singleValue": true }
            }
          ],
          "combinator": "and"
        }
      }
    },
    {
      "name": "Ask Aayumarg Care Companion",
      "type": "n8n-nodes-base.messageAnAgent",
      "typeVersion": 3.1,
      "position": [672, 0],
      "onError": "continueErrorOutput",
      "parameters": {
        "agentSource": "referenced",
        "agentId": {
          "__rl": true,
          "mode": "id",
          "value": "CqRGsbBKp5qCZyqQ",
          "cachedResultName": "Aayumarg Care Companion"
        },
        "message": "={{ $json.message }}",
        "advanced": {
          "enableStreaming": false,
          "session": {
            "session": {
              "sessionIdType": "customKey",
              "sessionKey": "={{ $json.sessionId }}"
            }
          }
        }
      }
    },
    {
      "name": "Reply to Website",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.5,
      "position": [1120, 16],
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ { reply: String($json.text || $json.output || \"Sorry, I could not prepare a reply right now. Please try again, or contact Aayumarg support at 7000698030 or info@aayumarg.com.\") } }}",
        "options": {
          "enableStreaming": false,
          "responseCode": 200,
          "responseHeaders": {
            "entries": [
              { "name": "Access-Control-Allow-Origin", "value": "={{ $(\"Validate Request\").item.json.corsOrigin }}" },
              { "name": "Vary", "value": "Origin" }
            ]
          }
        }
      }
    },
    {
      "name": "Server Error Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.5,
      "position": [1120, 208],
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ { error: \"Sorry, something went wrong. Please try again, or contact Aayumarg support at 7000698030.\" } }}",
        "options": {
          "enableStreaming": false,
          "responseCode": 500,
          "responseHeaders": {
            "entries": [
              { "name": "Access-Control-Allow-Origin", "value": "={{ $(\"Validate Request\").item.json.corsOrigin }}" },
              { "name": "Vary", "value": "Origin" }
            ]
          }
        }
      }
    },
    {
      "name": "Reject Request",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.5,
      "position": [784, 224],
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ { error: $json.error } }}",
        "options": {
          "enableStreaming": false,
          "responseCode": "={{ $json.status }}",
          "responseHeaders": {
            "entries": [
              { "name": "Access-Control-Allow-Origin", "value": "={{ $json.corsOrigin }}" },
              { "name": "Vary", "value": "Origin" }
            ]
          }
        }
      }
    }
  ],
  "connections": {
    "Website Chat Webhook": { "main": [[{ "node": "Validate Request", "type": "main", "index": 0 }]] },
    "Validate Request": { "main": [[{ "node": "Is Request Valid", "type": "main", "index": 0 }]] },
    "Is Request Valid": {
      "main": [
        [{ "node": "Ask Aayumarg Care Companion", "type": "main", "index": 0 }],
        [{ "node": "Reject Request", "type": "main", "index": 0 }]
      ]
    },
    "Ask Aayumarg Care Companion": {
      "main": [
        [{ "node": "Reply to Website", "type": "main", "index": 0 }],
        [{ "node": "Server Error Response", "type": "main", "index": 0 }]
      ]
    }
  },
  "settings": { "executionOrder": "v1" }
}
