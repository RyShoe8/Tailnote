/**
 * Executive Minimalist — serif name band, logo right, text social + portfolio rows.
 */
export const EXECUTIVE_MINIMALIST_SIGNATURE_TEMPLATE = `<table class="sig-executive-root" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 660px; font-family: {{fontFamily}}, Arial, Helvetica, sans-serif; font-size: 12px; color: #444444; line-height: 1.4; background-color: #ffffff;">
  <tr>
    <td style="padding-bottom: 12px; border-bottom: 1px solid #dddddd;">
      <table class="sig-executive-header-table" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
        <tr>
          <td valign="middle" style="padding-right: 20px;">
            {{#if hasName}}
            <div style="font-family: 'Times New Roman', Times, serif; font-size: 24px; color: #222222; margin-bottom: 2px;">{{fullName}}</div>
            {{/if}}
            {{#if hasExecutiveRoleLine}}
            <div style="font-size: 11px; font-weight: bold; color: #777777; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">{{executiveRoleLine}}</div>
            {{/if}}
            {{#if hasExecutiveContactLine}}
            <div style="font-size: 12px; color: #555555;">
              {{executiveContactLineHtml}}
            </div>
            {{/if}}
          </td>
          {{#if hasExecutiveLogoColumn}}
          <td valign="middle" style="text-align: left;">
            <table class="sig-logo-address-group" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: auto;">
              <tr>
                {{#if hasLogo}}
                <td valign="middle" style="padding-right: 10px; line-height: 0; font-size: 0; width: {{logoWidth}}px;">
                  <a href="{{logoLink}}" style="text-decoration: none; border: 0; outline: none; display: block;">
                    {{#if hasLogoSizedHeight}}
                    <img src="{{logoUrl}}" alt="{{companyName}}" width="{{logoWidth}}" height="{{logoDisplayHeight}}" style="display:block;max-width:{{logoWidth}}px;width:{{logoWidth}}px;height:{{logoDisplayHeight}}px;border:0;border-radius:{{logoImgBorderRadius}};" />
                    {{/if}}
                    {{#if hasLogoAutoHeight}}
                    <img src="{{logoUrl}}" alt="{{companyName}}" width="{{logoWidth}}" style="display:block;max-width:{{logoWidth}}px;width:{{logoWidth}}px;height:auto;border:0;border-radius:{{logoImgBorderRadius}};" />
                    {{/if}}
                  </a>
                </td>
                {{/if}}
                {{#if showAddressBlock}}
                <td valign="top" style="font-size: 11px; color: #888888; line-height: 1.35; letter-spacing: 0.2px;">
                  {{addressBlockHtml}}
                </td>
                {{/if}}
              </tr>
            </table>
          </td>
          {{/if}}
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding-top: 10px;">
      {{#if hasExecutiveSocialLine}}
      <div style="font-size: 10px; color: #888888; text-transform: uppercase; margin-bottom: 4px;">
        <strong>Connect:</strong> &nbsp;
        {{executiveSocialLineHtml}}
      </div>
      {{/if}}
      {{#if hasExecutivePromoRows}}
      {{executivePromoRowsHtml}}
      {{/if}}
    </td>
  </tr>
</table>`;
