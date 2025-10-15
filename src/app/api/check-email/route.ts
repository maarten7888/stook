import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    
    console.log("Checking email:", email);
    
    const supabase = createAdminClient();
    
    // Probeer de Admin API te gebruiken
    try {
      const { data: users, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        console.error("Admin API error:", error);
        // Fallback: return false (ga door met registratie)
        return NextResponse.json({ 
          exists: false,
          email: email,
          error: "Admin API not available, proceeding with registration"
        });
      }
      
      // Zoek naar een user met dit email adres
      const existingUser = users.users.find(user => user.email === email);
      
      console.log("User check result:", { exists: !!existingUser, email });
      
      return NextResponse.json({ 
        exists: !!existingUser,
        email: email 
      });
      
    } catch (adminError) {
      console.error("Admin API catch error:", adminError);
      // Fallback: return false (ga door met registratie)
      return NextResponse.json({ 
        exists: false,
        email: email,
        error: "Admin API failed, proceeding with registration"
      });
    }
    
  } catch (error) {
    console.error("Check email error:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
