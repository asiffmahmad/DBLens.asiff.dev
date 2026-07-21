"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DatabaseZap, ArrowRight } from "lucide-react";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
      
      <div className="container mx-auto px-4 flex justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md glass-card p-8 rounded-3xl border border-border/50 shadow-2xl relative z-10"
        >
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                <DatabaseZap className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold tracking-tight">DBLens</span>
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight mb-2">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your DBLens account to continue.
            </p>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="name@example.com"
                className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                required
              />
            </div>
            
            <Button className="w-full h-10" type="submit">
              Sign In with Email <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground backdrop-blur-xl">
                Or continue with
              </span>
            </div>
          </div>

          <Button variant="outline" type="button" className="w-full h-10 bg-background/50">
            <GitHubLogoIcon className="mr-2 h-4 w-4" />
            GitHub
          </Button>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Sign Up
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
