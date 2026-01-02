variable "resource_group_name" {
  type        = string
  description = "The name of the resource group"
}

variable "location" {
  type        = string
  description = "Azure region where the resources will be created"
  default     = "Sweden Central"
}

variable "app_name" {
  type        = string
  description = "Name of the static web app to be deployed"
}

variable "sku_tier" {
  description = "The SKU tier for the static web app"
  type        = string
  default     = "Standard"
}

variable "sku_size" {
  description = "The SKU size for the static web app"
  type        = string
  default     = "Standard"
}
