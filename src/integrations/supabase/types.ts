export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      abandoned_carts: {
        Row: {
          created_at: string
          customer_id: string | null
          email: string | null
          id: string
          items: Json
          phone: string | null
          recovered: boolean
          recovered_order_id: string | null
          subtotal: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          items?: Json
          phone?: string | null
          recovered?: boolean
          recovered_order_id?: string | null
          subtotal?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          items?: Json
          phone?: string | null
          recovered?: boolean
          recovered_order_id?: string | null
          subtotal?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "abandoned_carts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abandoned_carts_recovered_order_id_fkey"
            columns: ["recovered_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      addresses: {
        Row: {
          city: string
          complement: string | null
          created_at: string
          customer_id: string
          id: string
          is_primary: boolean
          neighborhood: string
          number: string
          reference: string | null
          state: string
          street: string
          zip: string
        }
        Insert: {
          city: string
          complement?: string | null
          created_at?: string
          customer_id: string
          id?: string
          is_primary?: boolean
          neighborhood: string
          number: string
          reference?: string | null
          state: string
          street: string
          zip: string
        }
        Update: {
          city?: string
          complement?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          is_primary?: boolean
          neighborhood?: string
          number?: string
          reference?: string | null
          state?: string
          street?: string
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_banners: {
        Row: {
          active: boolean
          badge_text: string | null
          bg_color: string | null
          created_at: string
          ends_at: string | null
          id: string
          image_url: string | null
          link_url: string
          position: string
          sort_order: number
          starts_at: string | null
          subtitle: string | null
          text_color: string | null
          title: string
        }
        Insert: {
          active?: boolean
          badge_text?: string | null
          bg_color?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          link_url?: string
          position?: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          text_color?: string | null
          title: string
        }
        Update: {
          active?: boolean
          badge_text?: string | null
          bg_color?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          link_url?: string
          position?: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          text_color?: string | null
          title?: string
        }
        Relationships: []
      }
      cash_accounts: {
        Row: {
          active: boolean
          balance: number
          created_at: string
          id: string
          name: string
          owner_user_id: string
        }
        Insert: {
          active?: boolean
          balance?: number
          created_at?: string
          id?: string
          name?: string
          owner_user_id: string
        }
        Update: {
          active?: boolean
          balance?: number
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string
        }
        Relationships: []
      }
      cash_movements: {
        Row: {
          amount: number
          cash_account_id: string
          cost_center_id: string | null
          created_at: string
          description: string
          financial_category_id: string | null
          id: string
          movement_date: string
          owner_user_id: string
          reference_id: string | null
          reference_type: string | null
          type: string
        }
        Insert: {
          amount?: number
          cash_account_id: string
          cost_center_id?: string | null
          created_at?: string
          description?: string
          financial_category_id?: string | null
          id?: string
          movement_date?: string
          owner_user_id: string
          reference_id?: string | null
          reference_type?: string | null
          type?: string
        }
        Update: {
          amount?: number
          cash_account_id?: string
          cost_center_id?: string | null
          created_at?: string
          description?: string
          financial_category_id?: string | null
          id?: string
          movement_date?: string
          owner_user_id?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_cash_account_id_fkey"
            columns: ["cash_account_id"]
            isOneToOne: false
            referencedRelation: "cash_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_financial_category_id_fkey"
            columns: ["financial_category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      cost_centers: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          owner_user_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          owner_user_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          ends_at: string | null
          id: string
          min_order: number
          starts_at: string | null
          type: string
          usage_count: number
          usage_limit: number | null
          value: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          ends_at?: string | null
          id?: string
          min_order?: number
          starts_at?: string | null
          type?: string
          usage_count?: number
          usage_limit?: number | null
          value?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          min_order?: number
          starts_at?: string | null
          type?: string
          usage_count?: number
          usage_limit?: number | null
          value?: number
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          email: string
          id: string
          last_order_at: string | null
          name: string
          order_count: number | null
          phone: string | null
          total_spent: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          last_order_at?: string | null
          name: string
          order_count?: number | null
          phone?: string | null
          total_spent?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          last_order_at?: string | null
          name?: string
          order_count?: number | null
          phone?: string | null
          total_spent?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_categories: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          owner_user_id: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          owner_user_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      integration_logs: {
        Row: {
          channel: string
          created_at: string
          entity: string
          entity_id: string | null
          event_type: string
          id: string
          message: string | null
          payload_summary: Json | null
          status: string
        }
        Insert: {
          channel: string
          created_at?: string
          entity: string
          entity_id?: string | null
          event_type: string
          id?: string
          message?: string | null
          payload_summary?: Json | null
          status?: string
        }
        Update: {
          channel?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          event_type?: string
          id?: string
          message?: string | null
          payload_summary?: Json | null
          status?: string
        }
        Relationships: []
      }
      marketplace_configs: {
        Row: {
          active: boolean
          channel: string
          connection_status: string
          created_at: string
          credentials: Json | null
          environment: string
          id: string
          last_sync_at: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          channel: string
          connection_status?: string
          created_at?: string
          credentials?: Json | null
          environment?: string
          id?: string
          last_sync_at?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          channel?: string
          connection_status?: string
          created_at?: string
          credentials?: Json | null
          environment?: string
          id?: string
          last_sync_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          name: string | null
          source: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id?: string
          name?: string | null
          source?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          source?: string
        }
        Relationships: []
      }
      order_financial_links: {
        Row: {
          cash_movement_id: string | null
          created_at: string
          id: string
          order_id: string
          owner_user_id: string
          receivable_title_id: string | null
        }
        Insert: {
          cash_movement_id?: string | null
          created_at?: string
          id?: string
          order_id: string
          owner_user_id: string
          receivable_title_id?: string | null
        }
        Update: {
          cash_movement_id?: string | null
          created_at?: string
          id?: string
          order_id?: string
          owner_user_id?: string
          receivable_title_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_financial_links_cash_movement_id_fkey"
            columns: ["cash_movement_id"]
            isOneToOne: false
            referencedRelation: "cash_movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_financial_links_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_financial_links_receivable_title_id_fkey"
            columns: ["receivable_title_id"]
            isOneToOne: false
            referencedRelation: "receivable_titles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          name_snapshot: string
          order_id: string
          product_id: string | null
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          id?: string
          name_snapshot: string
          order_id: string
          product_id?: string | null
          quantity?: number
          subtotal?: number
          unit_price: number
        }
        Update: {
          id?: string
          name_snapshot?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          channel_origin: string
          created_at: string
          customer_id: string | null
          discount: number
          external_order_id: string | null
          id: string
          notes: string | null
          order_code: string
          payment_method: string | null
          payment_status: string
          shipping: number
          shipping_address_snapshot: Json | null
          status: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          channel_origin?: string
          created_at?: string
          customer_id?: string | null
          discount?: number
          external_order_id?: string | null
          id?: string
          notes?: string | null
          order_code: string
          payment_method?: string | null
          payment_status?: string
          shipping?: number
          shipping_address_snapshot?: Json | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          channel_origin?: string
          created_at?: string
          customer_id?: string | null
          discount?: number
          external_order_id?: string | null
          id?: string
          notes?: string | null
          order_code?: string
          payment_method?: string | null
          payment_status?: string
          shipping?: number
          shipping_address_snapshot?: Json | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payable_payments: {
        Row: {
          amount: number
          cash_account_id: string | null
          created_at: string
          id: string
          notes: string | null
          owner_user_id: string
          payable_title_id: string
          payment_date: string
        }
        Insert: {
          amount: number
          cash_account_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          owner_user_id: string
          payable_title_id: string
          payment_date?: string
        }
        Update: {
          amount?: number
          cash_account_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          owner_user_id?: string
          payable_title_id?: string
          payment_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "payable_payments_cash_account_id_fkey"
            columns: ["cash_account_id"]
            isOneToOne: false
            referencedRelation: "cash_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payable_payments_payable_title_id_fkey"
            columns: ["payable_title_id"]
            isOneToOne: false
            referencedRelation: "payable_titles"
            referencedColumns: ["id"]
          },
        ]
      }
      payable_titles: {
        Row: {
          amount: number
          created_at: string
          description: string
          due_date: string
          id: string
          installment_number: number
          owner_user_id: string
          paid_amount: number
          purchase_order_id: string | null
          status: string
          supplier_id: string | null
          total_installments: number
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          installment_number?: number
          owner_user_id: string
          paid_amount?: number
          purchase_order_id?: string | null
          status?: string
          supplier_id?: string | null
          total_installments?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          installment_number?: number
          owner_user_id?: string
          paid_amount?: number
          purchase_order_id?: string | null
          status?: string
          supplier_id?: string | null
          total_installments?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payable_titles_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payable_titles_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          active: boolean
          allows_installments: boolean
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          active?: boolean
          allows_installments?: boolean
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          active?: boolean
          allows_installments?: boolean
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      product_channel_mappings: {
        Row: {
          active_on_channel: boolean
          channel: string
          channel_inventory: number | null
          channel_price: number | null
          created_at: string
          external_product_id: string | null
          external_sku: string | null
          id: string
          last_sync_at: string | null
          product_id: string
        }
        Insert: {
          active_on_channel?: boolean
          channel: string
          channel_inventory?: number | null
          channel_price?: number | null
          created_at?: string
          external_product_id?: string | null
          external_sku?: string | null
          id?: string
          last_sync_at?: string | null
          product_id: string
        }
        Update: {
          active_on_channel?: boolean
          channel?: string
          channel_inventory?: number | null
          channel_price?: number | null
          created_at?: string
          external_product_id?: string | null
          external_sku?: string | null
          id?: string
          last_sync_at?: string | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_channel_mappings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          benefits: string | null
          bestseller: boolean
          brand: string | null
          category_id: string | null
          cost: number | null
          cover_image: string | null
          created_at: string
          featured: boolean
          full_description: string | null
          gallery: string[] | null
          how_to_use: string | null
          id: string
          ingredients: string | null
          inventory_count: number
          min_inventory: number
          name: string
          new_arrival: boolean
          price: number
          sale_price: number | null
          short_description: string | null
          sku: string | null
          slug: string
          tags: string[] | null
          updated_at: string
          weight_volume: string | null
        }
        Insert: {
          active?: boolean
          benefits?: string | null
          bestseller?: boolean
          brand?: string | null
          category_id?: string | null
          cost?: number | null
          cover_image?: string | null
          created_at?: string
          featured?: boolean
          full_description?: string | null
          gallery?: string[] | null
          how_to_use?: string | null
          id?: string
          ingredients?: string | null
          inventory_count?: number
          min_inventory?: number
          name: string
          new_arrival?: boolean
          price?: number
          sale_price?: number | null
          short_description?: string | null
          sku?: string | null
          slug: string
          tags?: string[] | null
          updated_at?: string
          weight_volume?: string | null
        }
        Update: {
          active?: boolean
          benefits?: string | null
          bestseller?: boolean
          brand?: string | null
          category_id?: string | null
          cost?: number | null
          cover_image?: string | null
          created_at?: string
          featured?: boolean
          full_description?: string | null
          gallery?: string[] | null
          how_to_use?: string | null
          id?: string
          ingredients?: string | null
          inventory_count?: number
          min_inventory?: number
          name?: string
          new_arrival?: boolean
          price?: number
          sale_price?: number | null
          short_description?: string | null
          sku?: string | null
          slug?: string
          tags?: string[] | null
          updated_at?: string
          weight_volume?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          id: string
          name: string
          product_id: string | null
          purchase_order_id: string
          quantity: number
          subtotal: number
          unit_cost: number
        }
        Insert: {
          id?: string
          name: string
          product_id?: string | null
          purchase_order_id: string
          quantity?: number
          subtotal?: number
          unit_cost?: number
        }
        Update: {
          id?: string
          name?: string
          product_id?: string | null
          purchase_order_id?: string
          quantity?: number
          subtotal?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          discount: number
          expected_delivery: string | null
          freight: number
          id: string
          installments: number
          notes: string | null
          order_date: string
          owner_user_id: string
          po_code: string
          status: string
          subtotal: number
          supplier_id: string
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount?: number
          expected_delivery?: string | null
          freight?: number
          id?: string
          installments?: number
          notes?: string | null
          order_date?: string
          owner_user_id: string
          po_code: string
          status?: string
          subtotal?: number
          supplier_id: string
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount?: number
          expected_delivery?: string | null
          freight?: number
          id?: string
          installments?: number
          notes?: string | null
          order_date?: string
          owner_user_id?: string
          po_code?: string
          status?: string
          subtotal?: number
          supplier_id?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      receivable_receipts: {
        Row: {
          amount: number
          cash_account_id: string | null
          created_at: string
          id: string
          notes: string | null
          owner_user_id: string
          payment_method_id: string | null
          receipt_date: string
          title_id: string
        }
        Insert: {
          amount: number
          cash_account_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          owner_user_id: string
          payment_method_id?: string | null
          receipt_date?: string
          title_id: string
        }
        Update: {
          amount?: number
          cash_account_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          owner_user_id?: string
          payment_method_id?: string | null
          receipt_date?: string
          title_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receivable_receipts_cash_account_id_fkey"
            columns: ["cash_account_id"]
            isOneToOne: false
            referencedRelation: "cash_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivable_receipts_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivable_receipts_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "receivable_titles"
            referencedColumns: ["id"]
          },
        ]
      }
      receivable_titles: {
        Row: {
          amount: number
          created_at: string
          customer_id: string | null
          description: string
          due_date: string
          id: string
          installment_number: number
          order_id: string | null
          owner_user_id: string
          paid_amount: number
          payment_method_id: string | null
          sale_id: string | null
          status: string
          total_installments: number
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_id?: string | null
          description?: string
          due_date?: string
          id?: string
          installment_number?: number
          order_id?: string | null
          owner_user_id: string
          paid_amount?: number
          payment_method_id?: string | null
          sale_id?: string | null
          status?: string
          total_installments?: number
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string | null
          description?: string
          due_date?: string
          id?: string
          installment_number?: number
          order_id?: string | null
          owner_user_id?: string
          paid_amount?: number
          payment_method_id?: string | null
          sale_id?: string | null
          status?: string
          total_installments?: number
        }
        Relationships: [
          {
            foreignKeyName: "receivable_titles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivable_titles_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivable_titles_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivable_titles_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          approved: boolean
          comment: string | null
          created_at: string
          customer_id: string | null
          id: string
          product_id: string
          rating: number
        }
        Insert: {
          approved?: boolean
          comment?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          product_id: string
          rating: number
        }
        Update: {
          approved?: boolean
          comment?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          product_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          id: string
          name: string
          product_id: string | null
          quantity: number
          sale_id: string
          subtotal: number
          unit_price: number
        }
        Insert: {
          id?: string
          name: string
          product_id?: string | null
          quantity?: number
          sale_id: string
          subtotal?: number
          unit_price?: number
        }
        Update: {
          id?: string
          name?: string
          product_id?: string | null
          quantity?: number
          sale_id?: string
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          channel_id: string
          created_at: string
          customer_id: string | null
          customer_name: string
          discount: number
          id: string
          installments: number
          notes: string | null
          owner_user_id: string
          payment_method_id: string
          sale_code: string
          sale_date: string
          status: string
          subtotal: number
          total: number
        }
        Insert: {
          channel_id: string
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          discount?: number
          id?: string
          installments?: number
          notes?: string | null
          owner_user_id: string
          payment_method_id: string
          sale_code?: string
          sale_date?: string
          status?: string
          subtotal?: number
          total?: number
        }
        Update: {
          channel_id?: string
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          discount?: number
          id?: string
          installments?: number
          notes?: string | null
          owner_user_id?: string
          payment_method_id?: string
          sale_code?: string
          sale_date?: string
          status?: string
          subtotal?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "sales_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_channels: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      stock_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          notified: boolean
          notified_at: string | null
          product_id: string
          threshold: number
        }
        Insert: {
          alert_type?: string
          created_at?: string
          id?: string
          notified?: boolean
          notified_at?: string | null
          product_id: string
          threshold?: number
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          notified?: boolean
          notified_at?: string | null
          product_id?: string
          threshold?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          active: boolean
          contact_name: string | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          owner_user_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          contact_name?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          owner_user_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          contact_name?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          owner_user_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          channel: string
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: string
          subject: string
        }
        Insert: {
          channel?: string
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string
          subject: string
        }
        Update: {
          channel?: string
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_order: {
        Args: {
          p_address: Json
          p_coupon_code?: string
          p_customer_email: string
          p_customer_name: string
          p_customer_phone: string
          p_items: Json
          p_payment_method: string
          p_user_id?: string
        }
        Returns: Json
      }
      create_purchase_order: {
        Args: {
          p_discount?: number
          p_expected_delivery?: string
          p_freight?: number
          p_installments?: number
          p_items: Json
          p_notes?: string
          p_order_date?: string
          p_supplier_id: string
        }
        Returns: Json
      }
      create_sale: {
        Args: {
          p_channel_slug?: string
          p_customer_id?: string
          p_customer_name: string
          p_discount?: number
          p_installments?: number
          p_items: Json
          p_notes?: string
          p_payment_slug?: string
          p_sale_date?: string
        }
        Returns: Json
      }
      decrement_inventory: {
        Args: { p_product_id: string; p_qty: number }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_coupon_usage: {
        Args: { p_coupon_id: string }
        Returns: undefined
      }
      register_payment: {
        Args: { p_amount?: number; p_title_id: string }
        Returns: Json
      }
      register_receipt: {
        Args: { p_amount?: number; p_title_id: string }
        Returns: Json
      }
      validate_coupon: {
        Args: { p_code: string; p_order_total: number }
        Returns: {
          coupon_id: string
          discount_value: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "customer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "customer"],
    },
  },
} as const
