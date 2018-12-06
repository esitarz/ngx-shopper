import { Component, OnInit, Inject, ViewChild, OnDestroy } from '@angular/core';
import {
  applicationConfiguration,
  AppConfig,
} from '@app-buyer/config/app.config';
import { Router, ActivatedRoute } from '@angular/router';
import {
  faSearch,
  faShoppingCart,
  faPhone,
  faQuestionCircle,
  faUserCircle,
  faSignOutAlt,
  faHome,
  faBars,
  faCog
} from '@fortawesome/free-solid-svg-icons';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { AppStateService } from '@app-buyer/shared';
import { Order, MeUser, ListCategory } from '@ordercloud/angular-sdk';
import { takeWhile, tap, debounceTime, delay, filter } from 'rxjs/operators';
import { AddToCartEvent } from '@app-buyer/shared/models/add-to-cart-event.interface';
import { AppAuthService } from '@app-buyer/auth';
import { SearchComponent } from '@app-buyer/shared/components/search/search.component';

@Component({
  selector: 'layout-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  categories$: Observable<ListCategory>;
  isCollapsed = true;
  anonymous$: Observable<boolean> = this.appStateService.isAnonSubject;
  user$: Observable<MeUser> = this.appStateService.userSubject;
  currentOrder: Order;
  alive = true;
  addToCartQuantity: number;
  @ViewChild('addtocartPopover') public popover: NgbPopover;
  @ViewChild(SearchComponent) public search: SearchComponent;

  faSearch = faSearch;
  faShoppingCart = faShoppingCart;
  faPhone = faPhone;
  faQuestionCircle = faQuestionCircle;
  faSignOutAlt = faSignOutAlt;
  faUserCircle = faUserCircle;
  faHome = faHome;
  faBars = faBars;
  faCog = faCog;

  private isSideBarOpen = false;

  constructor(
    private appStateService: AppStateService,
    private appAuthService: AppAuthService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    @Inject(applicationConfiguration) protected appConfig: AppConfig
  ) { }

  ngOnInit() {
    this.appStateService.orderSubject
      .pipe(takeWhile(() => this.alive))
      .subscribe((order) => (this.currentOrder = order));

    this.buildAddToCartListener();
    this.clearSearchOnNavigate();
  }

  protected toggleSidebar() {
    this.isSideBarOpen = !this.isSideBarOpen;
  }


  isMobile(): boolean {
    return window.innerWidth < 768; // max width for bootstrap's sm breakpoint
  }

  buildAddToCartListener() {
    this.appStateService.addToCartSubject
      .pipe(
        tap((event: AddToCartEvent) => {
          this.popover.close();
          this.popover.ngbPopover = `${event.quantity} ${
            event.LineItemId
              ? 'Qty Updated in the Cart'
              : 'Item(s) Added to Cart'
            }`;
        }),
        delay(300),
        tap(() => {
          this.popover.open();
        }),
        debounceTime(3000)
      )
      .subscribe(() => {
        this.popover.close();
      });
  }

  searchProducts(searchStr: string) {
    this.router.navigate(['/products'], { queryParams: { search: searchStr } });
  }

  logout() {
    this.appAuthService.logout();
  }

  clearSearchOnNavigate() {
    this.activatedRoute.queryParams
      .pipe(
        filter((queryParams) => {
          return typeof queryParams.search === 'undefined';
        }),
        takeWhile(() => this.alive)
      )
      .subscribe(() => {
        if (this.search) {
          this.search.clearWithoutEmit();
        }
      });
  }

  // TODO: we should move responsibility for 'showing' up to the parent component instead of hard-coding route-names.
  showHeader() {
    const hiddenRoutes = [
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
    ];
    return !hiddenRoutes.some((el) => this.router.url.indexOf(el) > -1);
  }

  ngOnDestroy() {
    this.alive = false;
  }
}
