terraform {
  required_version = ">= 1.6.0"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

variable "cloudflare_account_id" { type = string }
variable "cloudflare_api_token"  { type = string, sensitive = true }

# Example: KV namespace for Workers (adjust as needed)
resource "cloudflare_workers_kv_namespace" "app_kv" {
  account_id = var.cloudflare_account_id
  title      = "app-kv"
}

output "kv_namespace_id" {
  value = cloudflare_workers_kv_namespace.app_kv.id
}
