"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { testDatabaseConnection } from "./test-db";
import { testSimpleConnection } from "./test-simple-db";
import { testAlternativeUrls } from "./test-urls";
import { toast } from "sonner";

export function DatabaseTest() {
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  async function handleTest() {
    setIsTesting(true);
    setResult(null);
    
    try {
      // Test 1: Alternative URLs
      console.log("Testing alternative URLs...");
      const urlResult = await testAlternativeUrls();
      console.log("URL test result:", urlResult);
      
      if (!urlResult.success) {
        setResult({ test: "urls", ...urlResult });
        toast.error(`URL test failed: ${urlResult.error}`);
        return;
      }
      
      // Test 2: Simple connection with working URL
      console.log("Testing simple connection...");
      const simpleResult = await testSimpleConnection();
      console.log("Simple test result:", simpleResult);
      
      if (!simpleResult.success) {
        setResult({ url: urlResult, simple: simpleResult });
        toast.error(`Simple connection failed: ${simpleResult.error}`);
        return;
      }
      
      // Test 3: Full database connection
      console.log("Testing full database connection...");
      const testResult = await testDatabaseConnection();
      setResult({ url: urlResult, simple: simpleResult, full: testResult });
      
      if (testResult.success) {
        toast.success("Database connectie succesvol!");
      } else {
        toast.error(`Database test gefaald: ${testResult.error}`);
      }
    } catch (error) {
      console.error("Test error:", error);
      toast.error("Test gefaald");
      setResult({ success: false, error: "Test failed", details: error });
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <Card className="bg-coals border-ash">
      <CardHeader>
        <CardTitle className="text-ash">Database Connectie Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleTest} 
          disabled={isTesting}
          className="bg-ember hover:bg-ember/90"
        >
          {isTesting ? "Testen..." : "Test Database Connectie"}
        </Button>
        
        {result && (
          <div className="mt-4 p-4 bg-charcoal rounded-lg">
            <h3 className="text-ash font-medium mb-2">Test Resultaat:</h3>
            <pre className="text-smoke text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
