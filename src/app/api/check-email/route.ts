import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    
    const supabase = await createClient();
    
    // Gebruik de Admin API om te controleren of de user bestaat
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error("Error checking users:", error);
      return NextResponse.json({ error: "Failed to check email" }, { status: 500 });
    }
    
    // Zoek naar een user met dit email adres
    const existingUser = users.users.find(user => user.email === email);
    
    return NextResponse.json({ 
      exists: !!existingUser,
      email: email 
    });
    
  } catch (error) {
    console.error("Check email error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
