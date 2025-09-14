-- Create email templates table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'quote_delivery', 'follow_up', 'reminder'
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb, -- Array of available variables like ["customerName", "quoteNumber"]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(type, is_active) -- Only one active template per type
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Admin access policies
CREATE POLICY "Admins can manage email templates" 
ON public.email_templates 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates
INSERT INTO public.email_templates (name, type, subject, html_content, variables) VALUES
(
  'Quote Delivery Email',
  'quote_delivery',
  'Your Mercury Motor Quote #{{quoteNumber}} from Harris Boat Works',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Mercury Motor Quote</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; margin-top: 20px; margin-bottom: 20px;">
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #1a365d; font-size: 28px; margin: 0;">Harris Boat Works</h1>
      <p style="color: #4a5568; font-size: 16px; margin: 5px 0;">Mercury Marine Authorized Dealer</p>
    </div>
    
    <h2 style="color: #2d3748; font-size: 24px; margin-bottom: 20px;">Hello {{customerName}}!</h2>
    
    <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Thank you for your interest in Mercury motors! We''ve prepared a personalized quote for you.
    </p>
    
    <div style="background-color: #edf2f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #2d3748; margin: 0 0 15px 0;">Quote Details</h3>
      <p style="margin: 5px 0; color: #4a5568;"><strong>Quote Number:</strong> {{quoteNumber}}</p>
      <p style="margin: 5px 0; color: #4a5568;"><strong>Motor Model:</strong> {{motorModel}}</p>
      <p style="margin: 5px 0; color: #4a5568;"><strong>Total Price:</strong> ${{totalPrice}}</p>
    </div>
    
    <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 20px 0;">
      This quote is valid for 30 days. We''re here to answer any questions you may have about your Mercury motor selection.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="mailto:info@harrisboatworks.ca" style="background-color: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Contact Us</a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
    
    <p style="color: #718096; font-size: 14px; text-align: center; margin: 0;">
      Harris Boat Works - Mercury Marine<br>
      Phone: (Your Phone) | Email: info@harrisboatworks.ca<br>
      <em>Your trusted Mercury dealer</em>
    </p>
  </div>
</body>
</html>',
  '["customerName", "quoteNumber", "motorModel", "totalPrice"]'::jsonb
),
(
  'Follow-up Email',
  'follow_up',
  'Following up on your Mercury Motor quote #{{quoteNumber}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Follow-up on Your Quote</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; margin-top: 20px; margin-bottom: 20px;">
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #1a365d; font-size: 28px; margin: 0;">Harris Boat Works</h1>
      <p style="color: #4a5568; font-size: 16px; margin: 5px 0;">Mercury Marine Authorized Dealer</p>
    </div>
    
    <h2 style="color: #2d3748; font-size: 24px; margin-bottom: 20px;">Hi {{customerName}},</h2>
    
    <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      I wanted to follow up on the Mercury motor quote we prepared for you (Quote #{{quoteNumber}}).
    </p>
    
    <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Do you have any questions about the {{motorModel}} or would you like to discuss financing options? 
      We''re here to help make your boating dreams a reality.
    </p>
    
    <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3182ce;">
      <p style="margin: 0; color: #2d3748; font-weight: bold;">Ready to move forward?</p>
      <p style="margin: 10px 0 0 0; color: #4a5568;">Give us a call or reply to this email to get started!</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="mailto:info@harrisboatworks.ca" style="background-color: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">Reply to This Email</a>
      <a href="tel:your-phone-number" style="background-color: #38a169; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Call Us Now</a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
    
    <p style="color: #718096; font-size: 14px; text-align: center; margin: 0;">
      Harris Boat Works - Mercury Marine<br>
      Phone: (Your Phone) | Email: info@harrisboatworks.ca<br>
      <em>Your trusted Mercury dealer</em>
    </p>
  </div>
</body>
</html>',
  '["customerName", "quoteNumber", "motorModel"]'::jsonb
);