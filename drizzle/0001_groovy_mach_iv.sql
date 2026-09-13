DROP INDEX "users_email_idx";--> statement-breakpoint
CREATE INDEX "modules_release_status_display_order_idx" ON "modules" USING btree ("release_status","display_order");--> statement-breakpoint
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_provider_subscription_id_idx" ON "subscriptions" USING btree ("provider_subscription_id");--> statement-breakpoint
CREATE INDEX "user_modules_module_id_idx" ON "user_modules" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "assessment_attempts_user_started_at_idx" ON "assessment_attempts" USING btree ("user_id","started_at");--> statement-breakpoint
CREATE INDEX "notifications_user_created_at_idx" ON "notifications" USING btree ("user_id","created_at");

