// Generated from the official Dotfy OpenAPI contract. Server only.
export const DOTFY_OPERATIONS = {
  "getAnalytics": {
    "method": "GET",
    "path": "/api/analytics",
    "area": "analytics",
    "parameters": [
      {
        "name": "period",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "7",
            "30",
            "90"
          ],
          "default": "7"
        }
      },
      {
        "name": "startDate",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "format": "date",
          "example": "2026-08-01"
        }
      },
      {
        "name": "endDate",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "format": "date",
          "example": "2026-08-30"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "getMe": {
    "method": "GET",
    "path": "/api/auth/me",
    "area": "auth",
    "parameters": [],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "getBalance": {
    "method": "GET",
    "path": "/api/balance",
    "area": "balance",
    "parameters": [
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "default": 20,
          "minimum": 1,
          "maximum": 100
        }
      },
      {
        "name": "refresh",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "true"
          ]
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "createCardCharge": {
    "method": "POST",
    "path": "/api/card-charges",
    "area": "card",
    "parameters": [],
    "rateLimit": {
      "scope": "route",
      "limit": 60,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "application/json"
    ]
  },
  "getCardCharge": {
    "method": "GET",
    "path": "/api/card-charges/{id}",
    "area": "card",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        },
        "example": "cmf4t1y5r0007l408c3d9p2mq",
        "description": "Identificador devolvido em `data.id` por `POST /api/card-charges`."
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "getCardFees": {
    "method": "GET",
    "path": "/api/card-fees",
    "area": "card",
    "parameters": [],
    "rateLimit": {
      "scope": "route",
      "limit": 60,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "createCardPayment": {
    "method": "POST",
    "path": "/api/card-payments",
    "area": "card",
    "parameters": [],
    "rateLimit": {
      "scope": "route",
      "limit": 60,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "createCharge": {
    "method": "POST",
    "path": "/api/charges",
    "area": "charges",
    "parameters": [],
    "rateLimit": {
      "scope": "route",
      "limit": 100,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "application/json"
    ]
  },
  "listCharges": {
    "method": "GET",
    "path": "/api/charges",
    "area": "charges",
    "parameters": [
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "default": 1
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 50,
          "default": 10
        }
      },
      {
        "name": "status",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "ACTIVE",
            "COMPLETED",
            "EXPIRED",
            "REFUNDED"
          ]
        }
      },
      {
        "name": "search",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "startDate",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "format": "date"
        }
      },
      {
        "name": "endDate",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "format": "date"
        }
      },
      {
        "name": "minValue",
        "in": "query",
        "required": false,
        "schema": {
          "type": "number"
        }
      },
      {
        "name": "maxValue",
        "in": "query",
        "required": false,
        "schema": {
          "type": "number"
        }
      },
      {
        "name": "sortBy",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "createdAt",
            "value",
            "paidAt",
            "status"
          ],
          "default": "createdAt"
        }
      },
      {
        "name": "sortOrder",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "asc",
            "desc"
          ],
          "default": "desc"
        }
      },
      {
        "name": "include",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "international"
          ]
        }
      },
      {
        "name": "recurring",
        "in": "query",
        "required": false,
        "schema": {
          "type": "boolean"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "getChargeDetail": {
    "method": "GET",
    "path": "/api/charges/detail/{id}",
    "area": "charges",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string",
          "example": "cmf3q8x2t0004l204b1n7k9zc"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "listChargeWebhooks": {
    "method": "GET",
    "path": "/api/charges/detail/{id}/webhooks",
    "area": "charges",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string",
          "example": "cmf3q8x2t0004l204b1n7k9zc"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "simulateChargePayment": {
    "method": "POST",
    "path": "/api/charges/simulate-payment",
    "area": "charges",
    "parameters": [],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "application/json"
    ]
  },
  "getChargeByCorrelationId": {
    "method": "GET",
    "path": "/api/charges/{correlationID}",
    "area": "charges",
    "parameters": [
      {
        "name": "correlationID",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string",
          "example": "dotfy-1788048000000-3f6a2b1c"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "listCustomers": {
    "method": "GET",
    "path": "/api/customers",
    "area": "customers",
    "parameters": [
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "default": 1
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "default": 20
        }
      },
      {
        "name": "search",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "status",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "active",
            "inactive"
          ]
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "getCustomer": {
    "method": "GET",
    "path": "/api/customers/{id}",
    "area": "customers",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string",
          "example": "NTI5OTgyMjQ3MjU"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "listDashboardActivity": {
    "method": "GET",
    "path": "/api/dashboard/activity",
    "area": "analytics",
    "parameters": [
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "default": 10,
          "maximum": 50
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "getDashboardByRegion": {
    "method": "GET",
    "path": "/api/dashboard/by-region",
    "area": "analytics",
    "parameters": [
      {
        "name": "period",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "today",
            "7days",
            "30days",
            "month"
          ],
          "default": "7days"
        }
      },
      {
        "name": "startDate",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "format": "date",
          "example": "2026-08-01"
        }
      },
      {
        "name": "endDate",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "format": "date",
          "example": "2026-08-30"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "getDashboardConversionRate": {
    "method": "GET",
    "path": "/api/dashboard/conversion-rate",
    "area": "analytics",
    "parameters": [
      {
        "name": "period",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "7",
            "30",
            "90",
            "today",
            "7days",
            "30days",
            "month"
          ],
          "default": "7"
        }
      },
      {
        "name": "startDate",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "format": "date",
          "example": "2026-08-01"
        }
      },
      {
        "name": "endDate",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "format": "date",
          "example": "2026-08-30"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "getDashboardPaymentMethods": {
    "method": "GET",
    "path": "/api/dashboard/payment-methods",
    "area": "analytics",
    "parameters": [
      {
        "name": "period",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "today",
            "7days",
            "30days",
            "month"
          ],
          "default": "30days"
        }
      },
      {
        "name": "startDate",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "format": "date",
          "example": "2026-08-01"
        }
      },
      {
        "name": "endDate",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "format": "date",
          "example": "2026-08-30"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "listDashboardRecent": {
    "method": "GET",
    "path": "/api/dashboard/recent",
    "area": "analytics",
    "parameters": [
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "default": 10,
          "maximum": 50
        }
      },
      {
        "name": "status",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "completed"
          ]
        }
      },
      {
        "name": "include",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "international"
          ]
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "getDashboardRevenue": {
    "method": "GET",
    "path": "/api/dashboard/revenue",
    "area": "analytics",
    "parameters": [
      {
        "name": "period",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "today",
            "7days",
            "30days",
            "month"
          ],
          "default": "7days"
        }
      },
      {
        "name": "startDate",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "format": "date",
          "example": "2026-08-01"
        }
      },
      {
        "name": "endDate",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "format": "date",
          "example": "2026-08-30"
        }
      },
      {
        "name": "includeLinked",
        "in": "query",
        "required": false,
        "schema": {
          "type": "boolean",
          "default": false
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "getDashboardStats": {
    "method": "GET",
    "path": "/api/dashboard/stats",
    "area": "analytics",
    "parameters": [
      {
        "name": "period",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "today",
            "7days",
            "30days",
            "month"
          ],
          "default": "7days"
        }
      },
      {
        "name": "startDate",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "format": "date",
          "example": "2026-08-01"
        }
      },
      {
        "name": "endDate",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "format": "date",
          "example": "2026-08-30"
        }
      },
      {
        "name": "includeLinked",
        "in": "query",
        "required": false,
        "schema": {
          "type": "boolean",
          "default": false
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "getDashboardTransactions": {
    "method": "GET",
    "path": "/api/dashboard/transactions",
    "area": "analytics",
    "parameters": [
      {
        "name": "period",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "today",
            "7days",
            "30days",
            "month"
          ],
          "default": "7days"
        }
      },
      {
        "name": "startDate",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "format": "date",
          "example": "2026-08-01"
        }
      },
      {
        "name": "endDate",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "format": "date",
          "example": "2026-08-30"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "getDashboardVolume": {
    "method": "GET",
    "path": "/api/dashboard/volume",
    "area": "analytics",
    "parameters": [],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "listDisputes": {
    "method": "GET",
    "path": "/api/disputes",
    "area": "disputes",
    "parameters": [
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "default": 20,
          "maximum": 100
        }
      },
      {
        "name": "status",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "OPENED",
            "ACKNOWLEDGED",
            "IN_REVIEW",
            "ACCEPTED",
            "REJECTED",
            "CANCELED"
          ]
        }
      },
      {
        "name": "type",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "MED",
            "CHARGEBACK"
          ]
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "getLastDisputeDefense": {
    "method": "GET",
    "path": "/api/disputes/last-defense",
    "area": "disputes",
    "parameters": [],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "listDisputeEvidences": {
    "method": "GET",
    "path": "/api/disputes/{id}/evidence",
    "area": "disputes",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "submitDisputeDefenseWithLinks": {
    "method": "POST",
    "path": "/api/disputes/{id}/evidence",
    "area": "disputes",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "application/json"
    ]
  },
  "getDisputeEvidenceDownloadUrl": {
    "method": "GET",
    "path": "/api/disputes/{id}/evidence/{evidenceId}/download",
    "area": "disputes",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "evidenceId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "getDisputeHistory": {
    "method": "GET",
    "path": "/api/disputes/{id}/history",
    "area": "disputes",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "submitDisputeDefense": {
    "method": "POST",
    "path": "/api/disputes/{id}/submit",
    "area": "disputes",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": [
      "application/json"
    ]
  },
  "uploadDisputeEvidence": {
    "method": "POST",
    "path": "/api/disputes/{id}/upload",
    "area": "disputes",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "multipart/form-data"
    ]
  },
  "createInternationalCharge": {
    "method": "POST",
    "path": "/api/international/charges",
    "area": "international",
    "parameters": [],
    "rateLimit": {
      "scope": "route",
      "limit": 60,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "application/json"
    ]
  },
  "listInternationalCharges": {
    "method": "GET",
    "path": "/api/international/charges",
    "area": "international",
    "parameters": [
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "default": 1
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 50,
          "default": 10
        }
      },
      {
        "name": "status",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "PENDING",
            "PAID",
            "FAILED",
            "REFUSED",
            "CANCELED",
            "EXPIRED",
            "BLOCKED",
            "REVERSED",
            "REFUNDED",
            "CHARGEDBACK"
          ]
        }
      },
      {
        "name": "country",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "AR",
            "MX",
            "CO",
            "EC",
            "VE",
            "PT",
            "BR"
          ]
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "getInternationalCharge": {
    "method": "GET",
    "path": "/api/international/charges/{id}",
    "area": "international",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        },
        "example": "cmf4t1y5r0007l408c3d9p2mq"
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "getInternationalQuote": {
    "method": "GET",
    "path": "/api/international/quote",
    "area": "international",
    "parameters": [
      {
        "name": "country",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string",
          "enum": [
            "AR",
            "MX",
            "CO",
            "EC",
            "VE",
            "PT"
          ]
        },
        "example": "MX"
      },
      {
        "name": "productId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        },
        "example": "cmf3q8x2t0004l204b1n7k9zc"
      },
      {
        "name": "value",
        "in": "query",
        "required": false,
        "schema": {
          "type": "number",
          "exclusiveMinimum": 0,
          "maximum": 10000000
        },
        "example": 249.9
      },
      {
        "name": "method",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "maxLength": 40
        },
        "description": "Opcional. O mesmo `method` do `POST`, para os países em que a taxa depende do MEIO de pagamento — sem ele, a cotação usa o meio padrão do país. Método não oferecido no país responde `400` com `code: \"METHOD_UNAVAILABLE\"`. Nos demais países é ignorado.",
        "example": "bank_transfer"
      }
    ],
    "rateLimit": {
      "scope": "route",
      "limit": 60,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "listMeds": {
    "method": "GET",
    "path": "/api/meds",
    "area": "disputes",
    "parameters": [
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "default": 20
        }
      },
      {
        "name": "status",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "aguardando_defesa",
            "em_analise",
            "favoravel",
            "perdida",
            "cancelada"
          ]
        }
      },
      {
        "name": "search",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "startDate",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "format": "date"
        }
      },
      {
        "name": "endDate",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "format": "date"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "getMed": {
    "method": "GET",
    "path": "/api/meds/{id}",
    "area": "disputes",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "listNotifications": {
    "method": "GET",
    "path": "/api/notifications",
    "area": "notifications",
    "parameters": [
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "default": 20,
          "maximum": 50
        }
      },
      {
        "name": "unread",
        "in": "query",
        "required": false,
        "schema": {
          "type": "boolean",
          "default": false
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "markNotificationsRead": {
    "method": "PATCH",
    "path": "/api/notifications",
    "area": "notifications",
    "parameters": [],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "application/json"
    ]
  },
  "listPixKeys": {
    "method": "GET",
    "path": "/api/pix-keys",
    "area": "pix-keys",
    "parameters": [],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "createPixKey": {
    "method": "POST",
    "path": "/api/pix-keys",
    "area": "pix-keys",
    "parameters": [],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "application/json"
    ]
  },
  "deletePixKey": {
    "method": "DELETE",
    "path": "/api/pix-keys",
    "area": "pix-keys",
    "parameters": [
      {
        "name": "id",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string",
          "example": "cmf3kb9q40003qv8h7a1b2c3d"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "setDefaultPixKey": {
    "method": "PATCH",
    "path": "/api/pix-keys",
    "area": "pix-keys",
    "parameters": [],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "application/json"
    ]
  },
  "lookupPixKey": {
    "method": "GET",
    "path": "/api/pix-keys/lookup",
    "area": "pix-keys",
    "parameters": [
      {
        "name": "key",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string",
          "example": "financeiro@nortesul.com.br"
        }
      },
      {
        "name": "type",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "CPF",
            "CNPJ",
            "EMAIL",
            "PHONE",
            "EVP"
          ]
        }
      }
    ],
    "rateLimit": {
      "scope": "route",
      "limit": 20,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "listProducts": {
    "method": "GET",
    "path": "/api/products",
    "area": "products",
    "parameters": [
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "default": 10,
          "minimum": 1,
          "maximum": 50
        }
      },
      {
        "name": "q",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "maxLength": 100
        }
      },
      {
        "name": "search",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "view",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "all",
            "active",
            "inactive",
            "with_sales",
            "no_sales"
          ],
          "default": "all"
        }
      },
      {
        "name": "status",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "active",
            "inactive"
          ]
        }
      },
      {
        "name": "active",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "sort",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "recent",
            "oldest",
            "title",
            "sales",
            "revenue",
            "views",
            "price_asc",
            "price_desc"
          ],
          "default": "recent"
        }
      },
      {
        "name": "method",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "example": "card,boleto"
        }
      },
      {
        "name": "country",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "AR",
            "MX",
            "CO",
            "EC",
            "VE",
            "PT"
          ]
        }
      },
      {
        "name": "priceMin",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "example": "49.90"
        }
      },
      {
        "name": "priceMax",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "example": "499.00"
        }
      },
      {
        "name": "createdFrom",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "format": "date",
          "example": "2026-08-01"
        }
      },
      {
        "name": "createdTo",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "format": "date",
          "example": "2026-08-31"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "createProduct": {
    "method": "POST",
    "path": "/api/products",
    "area": "products",
    "parameters": [],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "application/json"
    ]
  },
  "checkProductSlug": {
    "method": "GET",
    "path": "/api/products/slug-available",
    "area": "products",
    "parameters": [
      {
        "name": "slug",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 3,
          "maxLength": 50,
          "pattern": "^[a-z0-9-]+$",
          "example": "curso-de-marketing-digital"
        }
      }
    ],
    "rateLimit": {
      "scope": "route",
      "limit": 60,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "uploadProductImage": {
    "method": "POST",
    "path": "/api/products/upload",
    "area": "products",
    "parameters": [],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "multipart/form-data"
    ]
  },
  "getProduct": {
    "method": "GET",
    "path": "/api/products/{id}",
    "area": "products",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string",
          "example": "cmf3k8n0a0001x7p2r4qv9d1s"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "updateProduct": {
    "method": "PUT",
    "path": "/api/products/{id}",
    "area": "products",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string",
          "example": "cmf3k8n0a0001x7p2r4qv9d1s"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "application/json"
    ]
  },
  "deleteProduct": {
    "method": "DELETE",
    "path": "/api/products/{id}",
    "area": "products",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string",
          "example": "cmf3k8n0a0001x7p2r4qv9d1s"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "listProductAbandonedCarts": {
    "method": "GET",
    "path": "/api/products/{id}/abandoned",
    "area": "products",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string",
          "example": "cmf3k8n0a0001x7p2r4qv9d1s"
        }
      },
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "default": 1
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "default": 10
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "createPurchaseLink": {
    "method": "POST",
    "path": "/api/products/{id}/purchase-links",
    "area": "purchase-links",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        },
        "description": "Identificador do produto."
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "application/json"
    ]
  },
  "listProductPurchaseLinks": {
    "method": "GET",
    "path": "/api/products/{id}/purchase-links",
    "area": "purchase-links",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        },
        "description": "Identificador do produto."
      },
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "default": 20,
          "minimum": 1,
          "maximum": 100
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "getPurchaseLink": {
    "method": "GET",
    "path": "/api/purchase-links/{id}",
    "area": "purchase-links",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        },
        "description": "Identificador do link de compra."
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "revokePurchaseLink": {
    "method": "DELETE",
    "path": "/api/purchase-links/{id}",
    "area": "purchase-links",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        },
        "description": "Identificador do link de compra."
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "listRecurrences": {
    "method": "GET",
    "path": "/api/recurrences",
    "area": "recurrences",
    "parameters": [
      {
        "name": "status",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "PENDING_CONSENT",
            "ACTIVE",
            "REJECTED",
            "CANCELED",
            "EXPIRED",
            "COMPLETED"
          ]
        }
      },
      {
        "name": "customerTaxId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "example": "52998224725"
        }
      },
      {
        "name": "createdFrom",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "format": "date",
          "example": "2026-09-01"
        }
      },
      {
        "name": "createdTo",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "format": "date",
          "example": "2026-09-30"
        }
      },
      {
        "name": "frequency",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "WEEKLY",
            "MONTHLY",
            "QUARTERLY",
            "SEMIANNUALLY",
            "ANNUALLY"
          ]
        }
      },
      {
        "name": "valueMode",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "FIXED",
            "VARIABLE"
          ]
        }
      },
      {
        "name": "journey",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "AUTHORIZE_ONLY",
            "AUTHORIZE_AND_PAY"
          ]
        }
      },
      {
        "name": "q",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "example": "Ana"
        }
      },
      {
        "name": "view",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "all",
            "pending",
            "active",
            "canceled",
            "rejected",
            "completed"
          ]
        }
      },
      {
        "name": "sort",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "recent",
            "oldest",
            "next_charge",
            "value_desc",
            "value_asc"
          ]
        }
      },
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "default": 1
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 50,
          "default": 10
        }
      }
    ],
    "rateLimit": {
      "scope": "route",
      "limit": 100,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "createRecurrence": {
    "method": "POST",
    "path": "/api/recurrences",
    "area": "recurrences",
    "parameters": [],
    "rateLimit": {
      "scope": "route",
      "limit": 100,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "application/json"
    ]
  },
  "getRecurrenceMetrics": {
    "method": "GET",
    "path": "/api/recurrences/metrics",
    "area": "recurrences",
    "parameters": [
      {
        "name": "period",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "7d",
            "30d",
            "90d",
            "12m"
          ],
          "default": "30d"
        }
      },
      {
        "name": "scope",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "mine",
            "all"
          ],
          "default": "mine"
        }
      }
    ],
    "rateLimit": {
      "scope": "route",
      "limit": 100,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "getRecurrence": {
    "method": "GET",
    "path": "/api/recurrences/{id}",
    "area": "recurrences",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string",
          "example": "cmuh3k2r90001qy3fz6t1v4ka"
        }
      }
    ],
    "rateLimit": {
      "scope": "route",
      "limit": 100,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "cancelRecurrence": {
    "method": "POST",
    "path": "/api/recurrences/{id}/cancel",
    "area": "recurrences",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "rateLimit": {
      "scope": "route",
      "limit": 100,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": [
      "application/json"
    ]
  },
  "listRecurrenceEvents": {
    "method": "GET",
    "path": "/api/recurrences/{id}/events",
    "area": "recurrences",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "rateLimit": {
      "scope": "route",
      "limit": 100,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "listRecurrenceInstallments": {
    "method": "GET",
    "path": "/api/recurrences/{id}/installments",
    "area": "recurrences",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "rateLimit": {
      "scope": "route",
      "limit": 100,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "chargeRecurrenceInstallment": {
    "method": "POST",
    "path": "/api/recurrences/{id}/installments/{number}/charge",
    "area": "recurrences",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "number",
        "in": "path",
        "required": true,
        "schema": {
          "type": "integer",
          "minimum": 1
        }
      }
    ],
    "rateLimit": {
      "scope": "route",
      "limit": 100,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": [
      "application/json"
    ]
  },
  "retryRecurrenceInstallment": {
    "method": "POST",
    "path": "/api/recurrences/{id}/installments/{number}/retry",
    "area": "recurrences",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "number",
        "in": "path",
        "required": true,
        "schema": {
          "type": "integer",
          "minimum": 1
        }
      }
    ],
    "rateLimit": {
      "scope": "route",
      "limit": 100,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": [
      "application/json"
    ]
  },
  "setRecurrenceValue": {
    "method": "PATCH",
    "path": "/api/recurrences/{id}/value",
    "area": "recurrences",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "rateLimit": {
      "scope": "route",
      "limit": 100,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "application/json"
    ]
  },
  "listAbandonedCharges": {
    "method": "GET",
    "path": "/api/sales/abandoned",
    "area": "sales",
    "parameters": [
      {
        "name": "page",
        "in": "query",
        "required": false,
        "description": "Página, a partir de 1.",
        "schema": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "description": "Itens por página. Teto de 100.",
        "schema": {
          "type": "integer",
          "default": 20,
          "minimum": 1,
          "maximum": 100
        }
      },
      {
        "name": "search",
        "in": "query",
        "required": false,
        "description": "Busca sem diferenciar maiúsculas em nome, e-mail e telefone do cliente, correlationId e descrição.",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "status",
        "in": "query",
        "required": false,
        "description": "Sem o parâmetro, a lista traz ACTIVE e EXPIRED juntas.",
        "schema": {
          "type": "string",
          "enum": [
            "ACTIVE",
            "EXPIRED"
          ]
        }
      },
      {
        "name": "startDate",
        "in": "query",
        "required": false,
        "description": "Data de criação mínima (ISO 8601).",
        "schema": {
          "type": "string",
          "format": "date-time"
        }
      },
      {
        "name": "endDate",
        "in": "query",
        "required": false,
        "description": "Data de criação máxima (ISO 8601).",
        "schema": {
          "type": "string",
          "format": "date-time"
        }
      },
      {
        "name": "period",
        "in": "query",
        "required": false,
        "description": "Atalho para os últimos N dias. Não tem teto e só vale na ausência de startDate.",
        "schema": {
          "type": "integer"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "listSalesBuyers": {
    "method": "GET",
    "path": "/api/sales/buyers",
    "area": "sales",
    "parameters": [
      {
        "name": "page",
        "in": "query",
        "required": false,
        "description": "Página, a partir de 1.",
        "schema": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "description": "Compradores por página. Teto de 100.",
        "schema": {
          "type": "integer",
          "default": 20,
          "minimum": 1,
          "maximum": 100
        }
      },
      {
        "name": "search",
        "in": "query",
        "required": false,
        "description": "Busca sem diferenciar maiúsculas em nome e documento do pagador, e-mail e telefone do cliente.",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "sort",
        "in": "query",
        "required": false,
        "description": "Valor não reconhecido cai em total_spent.",
        "schema": {
          "type": "string",
          "default": "total_spent",
          "enum": [
            "total_spent",
            "transactions",
            "recent",
            "oldest"
          ]
        }
      },
      {
        "name": "startDate",
        "in": "query",
        "required": false,
        "description": "Data de pagamento mínima (ISO 8601).",
        "schema": {
          "type": "string",
          "format": "date-time"
        }
      },
      {
        "name": "endDate",
        "in": "query",
        "required": false,
        "description": "Data de pagamento máxima (ISO 8601).",
        "schema": {
          "type": "string",
          "format": "date-time"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "exportSalesData": {
    "method": "GET",
    "path": "/api/sales/export",
    "area": "sales",
    "parameters": [
      {
        "name": "type",
        "in": "query",
        "required": false,
        "description": "Conjunto exportado. Qualquer outro valor devolve 400.",
        "schema": {
          "type": "string",
          "default": "charges",
          "enum": [
            "charges",
            "buyers",
            "products"
          ]
        }
      },
      {
        "name": "format",
        "in": "query",
        "required": false,
        "description": "Com json a resposta é um envelope JSON; qualquer outro valor produz CSV com cabeçalho de download.",
        "schema": {
          "type": "string",
          "default": "csv",
          "enum": [
            "csv",
            "json"
          ]
        }
      },
      {
        "name": "status",
        "in": "query",
        "required": false,
        "description": "Só se aplica a type=charges. Valor fora da lista faz a consulta falhar com 500.",
        "schema": {
          "type": "string",
          "enum": [
            "ACTIVE",
            "COMPLETED",
            "EXPIRED",
            "REFUNDED"
          ]
        }
      },
      {
        "name": "startDate",
        "in": "query",
        "required": false,
        "description": "Data mínima (ISO 8601): de criação em type=charges, de pagamento em type=buyers.",
        "schema": {
          "type": "string",
          "format": "date-time"
        }
      },
      {
        "name": "endDate",
        "in": "query",
        "required": false,
        "description": "Data máxima (ISO 8601): de criação em type=charges, de pagamento em type=buyers.",
        "schema": {
          "type": "string",
          "format": "date-time"
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "description": "Máximo de registros. Teto de 10000.",
        "schema": {
          "type": "integer",
          "default": 5000,
          "minimum": 1,
          "maximum": 10000
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "getSalesOverview": {
    "method": "GET",
    "path": "/api/sales/overview",
    "area": "sales",
    "parameters": [
      {
        "name": "period",
        "in": "query",
        "required": false,
        "description": "Janela em dias. Fora de 1–365 o valor é ajustado para o limite mais próximo.",
        "schema": {
          "type": "integer",
          "default": 30,
          "minimum": 1,
          "maximum": 365
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "listSalesProductPerformance": {
    "method": "GET",
    "path": "/api/sales/products",
    "area": "sales",
    "parameters": [
      {
        "name": "page",
        "in": "query",
        "required": false,
        "description": "Página, a partir de 1.",
        "schema": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "description": "Produtos por página. Teto de 50.",
        "schema": {
          "type": "integer",
          "default": 10,
          "minimum": 1,
          "maximum": 50
        }
      },
      {
        "name": "search",
        "in": "query",
        "required": false,
        "description": "Busca sem diferenciar maiúsculas no título e no slug do produto.",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "sort",
        "in": "query",
        "required": false,
        "description": "Valor não reconhecido cai em revenue.",
        "schema": {
          "type": "string",
          "default": "revenue",
          "enum": [
            "revenue",
            "views",
            "orders",
            "conversion"
          ]
        }
      },
      {
        "name": "includeOrders",
        "in": "query",
        "required": false,
        "description": "Com a string literal true, cada produto traz os 10 pedidos mais recentes em recentOrders.",
        "schema": {
          "type": "string",
          "default": "false",
          "enum": [
            "true",
            "false"
          ]
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "getSalesTimeline": {
    "method": "GET",
    "path": "/api/sales/timeline",
    "area": "sales",
    "parameters": [
      {
        "name": "period",
        "in": "query",
        "required": false,
        "description": "Janela em dias. Fora de 1–90 o valor é ajustado para o limite mais próximo. Com 1 ou 2 a série vira horária.",
        "schema": {
          "type": "integer",
          "default": 30,
          "minimum": 1,
          "maximum": 90
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "listSalesTransactions": {
    "method": "GET",
    "path": "/api/sales/transactions",
    "area": "sales",
    "parameters": [
      {
        "name": "page",
        "in": "query",
        "required": false,
        "description": "Página, a partir de 1.",
        "schema": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "description": "Itens por página. Teto de 100.",
        "schema": {
          "type": "integer",
          "default": 20,
          "minimum": 1,
          "maximum": 100
        }
      },
      {
        "name": "search",
        "in": "query",
        "required": false,
        "description": "Busca sem diferenciar maiúsculas em correlationId, nome e e-mail do cliente, nome e documento do pagador, descrição e endToEndId.",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "status",
        "in": "query",
        "required": false,
        "description": "Filtra por um único status.",
        "schema": {
          "type": "string",
          "enum": [
            "ACTIVE",
            "COMPLETED",
            "EXPIRED",
            "REFUNDED"
          ]
        }
      },
      {
        "name": "startDate",
        "in": "query",
        "required": false,
        "description": "Data de criação mínima (ISO 8601).",
        "schema": {
          "type": "string",
          "format": "date-time"
        }
      },
      {
        "name": "endDate",
        "in": "query",
        "required": false,
        "description": "Data de criação máxima (ISO 8601).",
        "schema": {
          "type": "string",
          "format": "date-time"
        }
      },
      {
        "name": "minValue",
        "in": "query",
        "required": false,
        "description": "Valor mínimo em reais.",
        "schema": {
          "type": "number"
        }
      },
      {
        "name": "maxValue",
        "in": "query",
        "required": false,
        "description": "Valor máximo em reais.",
        "schema": {
          "type": "number"
        }
      },
      {
        "name": "hasProduct",
        "in": "query",
        "required": false,
        "description": "Aceita apenas as strings literais true e false; qualquer outro valor é ignorado.",
        "schema": {
          "type": "string",
          "enum": [
            "true",
            "false"
          ]
        }
      },
      {
        "name": "payerTaxId",
        "in": "query",
        "required": false,
        "description": "CPF ou CNPJ exato do pagador.",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "sort",
        "in": "query",
        "required": false,
        "description": "Valor não reconhecido cai em recent.",
        "schema": {
          "type": "string",
          "default": "recent",
          "enum": [
            "recent",
            "oldest",
            "value_asc",
            "value_desc"
          ]
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "getSplitAnalytics": {
    "method": "GET",
    "path": "/api/splits/analytics",
    "area": "splits",
    "parameters": [
      {
        "name": "startDate",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "format": "date"
        }
      },
      {
        "name": "endDate",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "format": "date"
        }
      },
      {
        "name": "status",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "PENDING",
            "COMPLETED",
            "FAILED"
          ]
        }
      },
      {
        "name": "recipientId",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "default": 20,
          "minimum": 1,
          "maximum": 100
        }
      },
      {
        "name": "refresh",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "true"
          ]
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "listReceivedSplits": {
    "method": "GET",
    "path": "/api/splits/received",
    "area": "splits",
    "parameters": [
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "default": 10,
          "minimum": 1,
          "maximum": 100
        }
      },
      {
        "name": "refresh",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "true"
          ]
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "createSubaccount": {
    "method": "POST",
    "path": "/api/subaccounts",
    "area": "subaccounts",
    "parameters": [],
    "rateLimit": {
      "scope": "route",
      "limit": 30,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "application/json"
    ]
  },
  "listSubaccounts": {
    "method": "GET",
    "path": "/api/subaccounts",
    "area": "subaccounts",
    "parameters": [
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "default": 1
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "default": 50
        }
      },
      {
        "name": "search",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "kycStatus",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "PENDING",
            "PRE_APPROVED",
            "IN_REVIEW",
            "DIDIT_APPROVED",
            "APPROVED",
            "REJECTED"
          ]
        }
      },
      {
        "name": "q",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "maxLength": 100
        }
      },
      {
        "name": "view",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "all",
            "active",
            "suspended",
            "kyc_pending",
            "with_balance"
          ],
          "default": "all"
        }
      },
      {
        "name": "sort",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "recent",
            "oldest",
            "name",
            "balance_desc",
            "balance_asc"
          ],
          "default": "recent"
        }
      },
      {
        "name": "kyc",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "PENDING",
            "PRE_APPROVED",
            "IN_REVIEW",
            "DIDIT_APPROVED",
            "APPROVED",
            "REJECTED"
          ]
        }
      },
      {
        "name": "acquirer",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "createdFrom",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "format": "date"
        }
      },
      {
        "name": "createdTo",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "format": "date"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "getSubaccount": {
    "method": "GET",
    "path": "/api/subaccounts/{id}",
    "area": "subaccounts",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "updateSubaccount": {
    "method": "PATCH",
    "path": "/api/subaccounts/{id}",
    "area": "subaccounts",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "application/json"
    ]
  },
  "deleteSubaccount": {
    "method": "DELETE",
    "path": "/api/subaccounts/{id}",
    "area": "subaccounts",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "listSubaccountActivity": {
    "method": "GET",
    "path": "/api/subaccounts/{id}/activity",
    "area": "subaccounts",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "default": 1
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 50,
          "default": 30
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "getSubaccountBalance": {
    "method": "GET",
    "path": "/api/subaccounts/{id}/balance",
    "area": "subaccounts",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "createSubaccountCharge": {
    "method": "POST",
    "path": "/api/subaccounts/{id}/charges",
    "area": "subaccounts",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "rateLimit": {
      "scope": "route",
      "limit": 100,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "application/json"
    ]
  },
  "listSubaccountCharges": {
    "method": "GET",
    "path": "/api/subaccounts/{id}/charges",
    "area": "subaccounts",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "default": 1
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "default": 50
        }
      },
      {
        "name": "status",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "ACTIVE",
            "COMPLETED",
            "EXPIRED",
            "REFUNDED"
          ]
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "getSubaccountCharge": {
    "method": "GET",
    "path": "/api/subaccounts/{id}/charges/{chargeId}",
    "area": "subaccounts",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "chargeId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "getSubaccountControls": {
    "method": "GET",
    "path": "/api/subaccounts/{id}/controls",
    "area": "subaccounts",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "updateSubaccountControls": {
    "method": "PUT",
    "path": "/api/subaccounts/{id}/controls",
    "area": "subaccounts",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "application/json"
    ]
  },
  "getSubaccountFeeMatrix": {
    "method": "GET",
    "path": "/api/subaccounts/{id}/fee-matrix",
    "area": "subaccounts",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "updateSubaccountFeeMatrix": {
    "method": "PUT",
    "path": "/api/subaccounts/{id}/fee-matrix",
    "area": "subaccounts",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "application/json"
    ]
  },
  "updateSubaccountFees": {
    "method": "PUT",
    "path": "/api/subaccounts/{id}/fees",
    "area": "subaccounts",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "application/json"
    ]
  },
  "submitSubaccountKyc": {
    "method": "POST",
    "path": "/api/subaccounts/{id}/kyc",
    "area": "subaccounts",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "rateLimit": {
      "scope": "route",
      "limit": 20,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "multipart/form-data"
    ]
  },
  "getSubaccountKyc": {
    "method": "GET",
    "path": "/api/subaccounts/{id}/kyc",
    "area": "subaccounts",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "createSubaccountPixKey": {
    "method": "POST",
    "path": "/api/subaccounts/{id}/pix-keys",
    "area": "subaccounts",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "application/json"
    ]
  },
  "listSubaccountPixKeys": {
    "method": "GET",
    "path": "/api/subaccounts/{id}/pix-keys",
    "area": "subaccounts",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "deleteSubaccountPixKey": {
    "method": "DELETE",
    "path": "/api/subaccounts/{id}/pix-keys/{keyId}",
    "area": "subaccounts",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "keyId",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "listSubaccountTransactions": {
    "method": "GET",
    "path": "/api/subaccounts/{id}/transactions",
    "area": "subaccounts",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "default": 1
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "default": 50
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "createSubaccountWithdrawal": {
    "method": "POST",
    "path": "/api/subaccounts/{id}/withdrawals",
    "area": "subaccounts",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "rateLimit": {
      "scope": "route",
      "limit": 30,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "application/json"
    ]
  },
  "listSubaccountWithdrawals": {
    "method": "GET",
    "path": "/api/subaccounts/{id}/withdrawals",
    "area": "subaccounts",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "default": 1
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "default": 50
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "listWebhookEndpoints": {
    "method": "GET",
    "path": "/api/webhook-endpoints",
    "area": "webhooks",
    "parameters": [],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "createWebhookEndpoint": {
    "method": "POST",
    "path": "/api/webhook-endpoints",
    "area": "webhooks",
    "parameters": [],
    "rateLimit": {
      "scope": "route",
      "limit": 100,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "application/json"
    ]
  },
  "getWebhookEndpoint": {
    "method": "GET",
    "path": "/api/webhook-endpoints/{id}",
    "area": "webhooks",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        },
        "example": "clx7k2p9a0003qz8f4h2m1n5b"
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "updateWebhookEndpoint": {
    "method": "PATCH",
    "path": "/api/webhook-endpoints/{id}",
    "area": "webhooks",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        },
        "example": "clx7k2p9a0003qz8f4h2m1n5b"
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "application/json"
    ]
  },
  "deleteWebhookEndpoint": {
    "method": "DELETE",
    "path": "/api/webhook-endpoints/{id}",
    "area": "webhooks",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        },
        "example": "clx7k2p9a0003qz8f4h2m1n5b"
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "rotateWebhookSecret": {
    "method": "POST",
    "path": "/api/webhook-endpoints/{id}",
    "area": "webhooks",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string"
        },
        "example": "clx7k2p9a0003qz8f4h2m1n5b"
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "listWithdrawals": {
    "method": "GET",
    "path": "/api/withdrawals",
    "area": "withdrawals",
    "parameters": [
      {
        "name": "page",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "default": 1,
          "minimum": 1
        }
      },
      {
        "name": "limit",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "default": 10,
          "minimum": 1,
          "maximum": 50
        }
      },
      {
        "name": "startDate",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "format": "date",
          "example": "2026-08-01"
        }
      },
      {
        "name": "endDate",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "format": "date",
          "example": "2026-08-30"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "createWithdrawal": {
    "method": "POST",
    "path": "/api/withdrawals",
    "area": "withdrawals",
    "parameters": [],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "application/json"
    ]
  },
  "cancelWithdrawal": {
    "method": "DELETE",
    "path": "/api/withdrawals",
    "area": "withdrawals",
    "parameters": [
      {
        "name": "id",
        "in": "query",
        "required": true,
        "schema": {
          "type": "string",
          "example": "cmf3k9x2p0001qv8h7a1b2c3d"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "listWithdrawalBiometrics": {
    "method": "GET",
    "path": "/api/withdrawals/biometrics",
    "area": "withdrawals",
    "parameters": [],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "enrollWithdrawalBiometric": {
    "method": "POST",
    "path": "/api/withdrawals/biometrics",
    "area": "withdrawals",
    "parameters": [],
    "rateLimit": {
      "scope": "route",
      "limit": 20,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "application/json"
    ]
  },
  "revokeWithdrawalBiometrics": {
    "method": "DELETE",
    "path": "/api/withdrawals/biometrics",
    "area": "withdrawals",
    "parameters": [],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  },
  "previewWithdrawalRecipient": {
    "method": "POST",
    "path": "/api/withdrawals/preview",
    "area": "withdrawals",
    "parameters": [],
    "rateLimit": {
      "scope": "route",
      "limit": 20,
      "window": "1m"
    },
    "bodyRequired": true,
    "contentTypes": [
      "application/json"
    ]
  },
  "getWithdrawal": {
    "method": "GET",
    "path": "/api/withdrawals/{id}",
    "area": "withdrawals",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string",
          "example": "cmf3k9x2p0001qv8h7a1b2c3d"
        }
      }
    ],
    "rateLimit": {
      "scope": "global",
      "limit": 600,
      "window": "1m"
    },
    "bodyRequired": false,
    "contentTypes": []
  }
} as const;
export type DotfyOperation=keyof typeof DOTFY_OPERATIONS;
