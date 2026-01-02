output "static_web_app_url" {
  description = "The default URL of the static web app"
  value       = azurerm_static_web_app.app.default_host_name
}

output "static_web_app_id" {
  description = "The ID of the static web app"
  value       = azurerm_static_web_app.app.id
}

output "static_web_app_api_key" {
  description = "The API key of the static web app"
  value       = azurerm_static_web_app.app.api_key
  sensitive   = true
}
