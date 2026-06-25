/**
 * Modern Professional layout — 3 column design
 * Left: vertical social icons in pill box
 * Middle: Logo, Name, Title, Company, Info
 * Right: Promotional content blocks / image
 */
export const MODERN_PROFESSIONAL_SIGNATURE_TEMPLATE = `<style type="text/css">
@media only screen and (min-width:601px),
  only screen and (min-device-width:601px) {
  tr.sig-blocks-stacked-row {
    display: none !important;
    max-height: 0 !important;
    overflow: hidden !important;
    mso-hide: all;
  }
  td.sig-blocks-desktop {
    display: table-cell !important;
  }
  td.sig-content-block-cell-left {
    padding-right: 12px !important;
  }
  td.sig-content-block-cell-right {
    padding-left: 12px !important;
    border-left: 1px solid #e5e5e5 !important;
    border-top: none !important;
  }
}
@media only screen and (max-width:600px),
  only screen and (max-width:768px),
  only screen and (max-device-width:600px),
  only screen and (max-device-width:812px) {
  table.sig-root-layout-table,
  table.sig-mp-header-layout-table {
    table-layout: auto !important;
    width: 100% !important;
  }
  td.sig-blocks-desktop {
    display: none !important;
    max-height: 0 !important;
    overflow: hidden !important;
    mso-hide: all;
  }
  tr.sig-blocks-stacked-row {
    display: table-row !important;
  }
  td.sig-content-block-cell {
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    float: none !important;
    clear: both !important;
    box-sizing: border-box !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    padding-bottom: 12px !important;
  }
  td.sig-content-block-cell-left {
    padding-bottom: 14px !important;
  }
  td.sig-content-block-cell-right {
    border-left: none !important;
    border-top: 1px solid #e5e5e5 !important;
    padding-top: 14px !important;
    padding-left: 0 !important;
  }
  table.sig-mp-card-shell {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
    overflow: visible !important;
  }
}
</style>
<table class="sig-mp-card-shell" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate;border-spacing:0;max-width:660px;width:100%;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;background-color:#ffffff;">
  <tr>
    <td style="padding:24px 24px;">
      <table class="sig-mp-header-layout-table" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;font-family: {{fontFamily}}, Arial, Helvetica, sans-serif; font-size:14px; color:#111827; line-height:1.4;">
        <tr>
          <!-- Left Column: Social Icons -->
          {{#if showSocialBlock}}
          <td class="sig-social-col" width="40" valign="top" style="vertical-align:top;padding-right:24px;">
            <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;border:1px solid #e5e7eb;border-radius:24px;width:40px;text-align:center;">
              <tr><td style="padding-top:12px;">
                <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
                  {{#if hasLinkedin}}<tr><td style="padding-bottom:12px;"><a href="{{linkedin}}"><img src="{{iconLinkedin}}" width="18" height="18" style="display:block;width:18px;height:18px;" /></a></td></tr>{{/if}}
                  {{#if hasInstagram}}<tr><td style="padding-bottom:12px;"><a href="{{instagram}}"><img src="{{iconInstagram}}" width="18" height="18" style="display:block;width:18px;height:18px;" /></a></td></tr>{{/if}}
                  {{#if hasFacebook}}<tr><td style="padding-bottom:12px;"><a href="{{facebook}}"><img src="{{iconFacebook}}" width="18" height="18" style="display:block;width:18px;height:18px;" /></a></td></tr>{{/if}}
                  {{#if hasYoutube}}<tr><td style="padding-bottom:12px;"><a href="{{youtube}}"><img src="{{iconYoutube}}" width="18" height="18" style="display:block;width:18px;height:18px;" /></a></td></tr>{{/if}}
                  {{#if hasReddit}}<tr><td style="padding-bottom:12px;"><a href="{{reddit}}"><img src="{{iconReddit}}" width="18" height="18" style="display:block;width:18px;height:18px;" /></a></td></tr>{{/if}}
                  {{#if hasDiscord}}<tr><td style="padding-bottom:12px;"><a href="{{discord}}"><img src="{{iconDiscord}}" width="18" height="18" style="display:block;width:18px;height:18px;" /></a></td></tr>{{/if}}
                  {{#if hasBluesky}}<tr><td style="padding-bottom:12px;"><a href="{{bluesky}}"><img src="{{iconBluesky}}" width="18" height="18" style="display:block;width:18px;height:18px;" /></a></td></tr>{{/if}}
                </table>
              </td></tr>
            </table>
          </td>
          {{/if}}

          <!-- Middle Column: Info -->
          <td class="sig-info-col" valign="top" style="vertical-align:top;padding-right:24px;">
            {{#if hasLogo}}
            <div style="margin-bottom:16px;">
              <a href="{{logoLink}}" style="text-decoration:none; border:0; outline:none; display:block;">
{{#if hasLogoSizedHeight}}
                <img src="{{logoUrl}}" width="{{logoWidth}}" height="{{logoDisplayHeight}}" border="0" alt="" style="display:block;max-width:{{logoWidth}}px;width:{{logoWidth}}px;height:{{logoDisplayHeight}}px;border:0;outline:none;text-decoration:none;border-radius:{{logoImgBorderRadius}};" />
{{/if}}
{{#if hasLogoAutoHeight}}
                <img src="{{logoUrl}}" width="{{logoWidth}}" border="0" alt="" style="display:block;max-width:{{logoWidth}}px;width:{{logoWidth}}px;height:auto;border:0;outline:none;text-decoration:none;border-radius:{{logoImgBorderRadius}};" />
{{/if}}
              </a>
            </div>
            {{/if}}

            {{#if hasName}}
            <div style="font-size:18px; font-weight:700; color:#111827; line-height:1.2; margin-bottom:4px; letter-spacing:-0.2px;">
              {{firstName}} {{lastName}}
            </div>
            {{/if}}
            {{#if hasTitle}}
            <div style="font-size:14px; color:#4B5563; margin-bottom:16px;">
              {{title}}
            </div>
            {{/if}}
            
            <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-size:14px;color:#111827;line-height:1.5;">
              {{#if companyName}}<tr><td style="padding-bottom:4px;font-weight:600;">{{companyName}}</td></tr>{{/if}}
              {{#if email}}<tr><td style="padding-bottom:4px;"><a href="mailto:{{email}}" style="color:{{primaryColor}};text-decoration:none;">{{email}}</a></td></tr>{{/if}}
              {{#if hasWebsite}}<tr><td style="padding-bottom:4px;"><a href="{{website}}" style="color:{{primaryColor}};text-decoration:none;">{{websiteDisplay}}</a></td></tr>{{/if}}
              {{#if officePhone}}<tr><td style="padding-bottom:4px;"><a href="{{officePhoneTelHref}}" style="color:#111827;text-decoration:none;">{{officePhone}}</a></td></tr>{{/if}}
              {{#if mobilePhone}}<tr><td style="padding-bottom:4px;"><a href="{{mobilePhoneTelHref}}" style="color:#111827;text-decoration:none;">M: {{mobilePhone}}</a></td></tr>{{/if}}
            </table>

            {{#if showAddressBlock}}
            <div style="margin-top: 16px; font-size: 12px; color: #6b7280; line-height: 1.4;">
              {{addressBlockHtml}}
            </div>
            {{/if}}
          </td>

          <!-- Right Column: Avatar -->
          {{#if hasAvatar}}
          <td class="sig-avatar-col" width="80" valign="top" style="vertical-align:top;padding-right:24px;">
            <img src="{{avatarUrl}}" width="80" height="80" style="display:block;width:80px;height:80px;border-radius:50%;object-fit:cover;border:1px solid #e5e7eb;" alt="Profile Picture" />
          </td>
          {{/if}}

          <!-- Right Column: Promo Blocks / Image -->
          {{#if hasContentBlocks}}
          <td class="sig-blocks-desktop" valign="top" width="220" style="vertical-align:top; border-left:1px solid #e5e7eb; padding-left:24px;">
            {{contentBlocksHtml}}
          </td>
          {{/if}}
        </tr>
      </table>

      <!-- Mobile Content Blocks -->
      {{#if hasContentBlocks}}
      <table class="sig-root-layout-table" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;font-family: {{fontFamily}}, Arial, Helvetica, sans-serif;">
        <tr class="sig-blocks-stacked-row" style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
          <td style="padding-top:20px;border-top:1px solid #e5e7eb;margin-top:20px;">
            {{contentBlocksHtmlStacked}}
          </td>
        </tr>
      </table>
      {{/if}}
    </td>
  </tr>
</table>
`;
